const express = require('express')
const router = express.Router()


const db = require('../db')
const { formatInsert, getNextInvoiceId, updateProductByInvoiceItems, isDateValid, 
    INVOICE_TYPE_2_INT
} = require('./utils.js')


const prefix = 'XT'
const typeStr = 'salesRefund'
const typeInt = INVOICE_TYPE_2_INT[typeStr]


router.get('/', (req, res) => {
    const deliveredTable = `SELECT invoiceId, 
        CASE WHEN COUNT(*) = SUM(delivered) THEN '全部配送'
            WHEN SUM(delivered) = 0 THEN '未配送'
            ELSE '部分配送' END AS delivered
        FROM invoiceItem GROUP BY invoiceId`
    const query = `SELECT i.*, d.delivered, orderId 
        FROM invoice AS i, (${deliveredTable}) AS d 
        LEFT JOIN invoiceRelation AS r ON i.id=r.refundId
        WHERE type=${typeInt} AND d.invoiceId=i.id
        ORDER BY i.id DESC`
    db.all(query, (err, refunds) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(refunds)
    })
})


router.get('/id/:id', (req, res) => {
    const refundId = req.params.id
    const selectRefund = `SELECT i.*, orderId, p.* 
        FROM invoice AS i, partner AS p, invoiceRelation AS r 
        WHERE id="${refundId}" AND partner=name AND r.refundId=i.id`
    db.each(selectRefund, (err, refund) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const selectOrderItems = `SELECT ii.price, ii.discount, ii.productId,
        ii.quantity AS maxQuantity,
        p.material, p.name, p.spec, p.unit
        FROM invoiceItem AS ii, product AS p
        WHERE ii.invoiceId="${refund.orderId}" AND p.id=ii.productId`

        const selectRefundItems = `SELECT ii.price, ii.discount, ii.productId,
        NULL AS maxQuantity,
        ii.id AS refundItemId, ii.quantity, ii.originalAmount, ii.amount, ii.remark, ii.delivered,
        p.material, p.name, p.spec, p.unit
        FROM invoiceItem AS ii, product AS p
        WHERE ii.invoiceId="${refundId}" AND p.id=ii.productId`

        db.all(selectOrderItems, (err, orderItems) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            db.all(selectRefundItems, (err, refundItems) => {
                if (err) {
                    console.error(err)
                    res.status(500).send(err)
                    return
                }
                const productsDict = {}
                for (const refundItem of refundItems) {
                    productsDict[refundItem.productId] = refundItem
                }
                for (const orderItem of orderItems) {
                    if (productsDict[orderItem.productId] === undefined) {
                        productsDict[orderItem.productId] = orderItem
                    } else {
                        productsDict[orderItem.productId].maxQuantity = orderItem.maxQuantity
                    }
                }
                res.send(Object.assign(refund, { items: Object.values(productsDict) }))
            })
        })
    })
})


router.post('/', async (req, res) => {
    // ---------- data ----------
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount || '0'
    const prepayment = req.body.prepayment || '0'
    const payment = req.body.payment || '0'
    const items = req.body.items || []
    const orderId = req.body.orderId

    // ---------- validate ----------
    if (!partner || !date || !orderId || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if (!isDateValid(date)) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. update products
    var productDictArray = await updateProductByInvoiceItems(items).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 2. insert salesRefund
    const refundId = await getNextInvoiceId(req.body.date, prefix).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    const refundInsert = `INSERT INTO invoice (id, type, partner, date, amount, prepayment, payment) VALUES 
        ("${refundId}", ${typeInt}, "${partner}", "${date}", "${amount}", "${prepayment}", "${payment}")`
    await new Promise((resolve, reject) => {
        db.run(refundInsert, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 3. insert invoice relation
    await new Promise((resolve, reject) => {
        db.run(`INSERT INTO invoiceRelation(orderId, refundId) VALUES ("${orderId}", "${refundId}")`, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 4. insert salesRefundItem
    const refundItemDictArray = productDictArray.map(productDict => {
        return {
            productId: productDict.id,
            price: productDict.info.price,
            discount: productDict.info.discount,
            quantity: productDict.info.quantity,
            originalAmount: productDict.info.originalAmount,
            amount: productDict.info.amount,
            remark: productDict.info.remark,
            delivered: productDict.info.delivered,
            invoiceId: refundId
        }
    })
    const { query, flatData } = formatInsert('INSERT', 'invoiceItem', refundItemDictArray, [])
    await new Promise((resolve, reject) => {
        db.run(query, flatData, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 5. return
    res.send({ id: refundId })
})


router.delete('/', async (req, res) => {
    const ids = (req.body.ids || []).map(id => `"${id}"`).join(', ')

    // 1. delete sales refund
    const deleteInvoice = `DELETE FROM invoice WHERE id IN (${ids})`
    db.run(deleteInvoice, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


router.put('/id/:id', async (req, res) => {
    // ---------- data ----------
    const refundId = req.params.id
    const newOrderId = req.body.orderId
    const partner = req.body.partner
    const amount = req.body.amount || '0'
    const date = req.body.date
    const items = req.body.items || []
    const payment = req.body.payment || '0'
    const prepayment = req.body.prepayment || '0'

    // ---------- validate ----------
    if (!partner || !date || !newOrderId || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if (!isDateValid(date)) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. delete old items
    const deleteOldRefundItems = `DELETE FROM invoiceItem WHERE invoiceId="${refundId}"`
    await new Promise((resolve, reject) => {
        db.run(deleteOldRefundItems, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 2. update refund info
    const updateRefund = `UPDATE invoice SET amount="${amount}", date="${date}", partner="${partner}", 
        prepayment="${prepayment}", payment="${payment}" WHERE id="${refundId}"`
    await new Promise((resolve, reject) => {
        db.run(updateRefund, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })


    // 3. update products
    var productDictArray = await updateProductByInvoiceItems(items).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })


    // 4. update invoice relation
    await new Promise((resolve, reject) => {
        db.run(`UPDATE invoiceRelation SET orderId="${newOrderId}" WHERE refundId="${refundId}"`, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 5. insert salesRefundItem
    const refundItemDictArray = productDictArray.map(productDict => {
        return {
            productId: productDict.id,
            price: productDict.info.price,
            discount: productDict.info.discount,
            quantity: productDict.info.quantity,
            originalAmount: productDict.info.originalAmount,
            amount: productDict.info.amount,
            remark: productDict.info.remark,
            delivered: productDict.info.delivered,
            invoiceId: refundId
        }
    })
    const { query, flatData } = formatInsert('INSERT', 'invoiceItem', refundItemDictArray, [])
    await new Promise((resolve, reject) => {
        db.run(query, flatData, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    res.end()
})


module.exports = router