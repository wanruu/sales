const express = require('express')
const router = express.Router()


const db = require('../db')
const { formatInsert, getNextInvoiceId, updateProductByInvoiceItems,
    isDateValid, getQuantitySign, INVOICE_TYPE_2_INT
} = require('./utils.js')


const prefix = 'CT'
const typeStr = 'purchaseRefund'
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
    const selectRefund = `SELECT i.*, orderId, p.address, p.phone 
        FROM invoice AS i, partner AS p, invoiceRelation AS r 
        WHERE id="${refundId}" AND partner=name AND r.refundId=i.id`
    db.each(selectRefund, (err, refund) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const refundItems = `SELECT ii.id AS refundItemId, productId, material, name, spec, unit, p.quantity AS remainingQuantity, 
            price, discount, ii.quantity, originalAmount, amount, remark, delivered 
            FROM invoiceItem ii, product p
            WHERE ii.invoiceId="${refundId}" AND ii.productId=p.id`
        const orderItems = `SELECT oi.*
            FROM invoiceRelation AS r, invoiceItem AS oi
            WHERE r.refundId="${refundId}" AND oi.invoiceId=r.orderId`
        const selectRefundItemsWithOrderInfo = `SELECT ri.*,
            IFNULL(IFNULL(oi.weight,0)/oi.quantity,0) AS unitWeight, oi.quantity AS maxQuantity
            FROM (${refundItems}) AS ri LEFT JOIN (${orderItems}) AS oi
            ON oi.productId=ri.productId`
        db.all(selectRefundItemsWithOrderInfo, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            res.send(Object.assign(refund, { items: items }))
        })
    })
})


router.post('/', async (req, res) => {
    // ---------- data ----------
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount
    const prepayment = req.body.prepayment || '0'
    const payment = req.body.payment || '0'
    const items = req.body.items || []
    const orderId = req.body.orderId

    // ---------- validate ----------
    if (!partner || !date || !amount || !orderId || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if (!isDateValid(date)) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. update products
    var productDictArray = await updateProductByInvoiceItems(items, typeStr).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    
    // 2. insert purchase refund
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

    // 4. insert purchaseRefundItem
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
    res.end()
})


router.delete('/', async (req, res) => {
    const ids = (req.body.ids || []).map(id => `"${id}"`).join(', ')

    // 1. update product quantity
    const updateProduct = `UPDATE product
        SET quantity=product.quantity${getQuantitySign(typeStr, true)}oi.quantity
        FROM invoice AS i, invoiceItem AS oi
        WHERE i.id IN (${ids}) AND i.id=oi.invoiceId AND oi.productId=product.id`
    db.run(updateProduct, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        // 2. delete purchase refund
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
})


router.put('/id/:id', async (req, res) => {
    // ---------- data ----------
    const refundId = req.params.id
    const newOrderId = req.body.orderId
    const partner = req.body.partner
    const amount = req.body.amount
    const date = req.body.date
    const items = req.body.items || []
    const payment = req.body.payment || '0'
    const prepayment = req.body.prepayment || '0'

    // ---------- validate ----------
    if (!partner || !date || !amount || !newOrderId || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if (!isDateValid(date)) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. update products & delete old items
    const updateProducts = `UPDATE product
        SET quantity=product.quantity${getQuantitySign(typeStr, true)}ri.quantity
        FROM invoiceItem AS ri
        WHERE ri.invoiceId="${refundId}" AND product.id=ri.productId`
    const deleteOldRefundItems = `DELETE FROM invoiceItem WHERE invoiceId="${refundId}"`
    await new Promise((resolve, reject) => {
        db.run(updateProducts, err => {
            if (err) { reject(err) }
            db.run(deleteOldRefundItems, err => {
                if (err) { reject(err) }
                resolve()
            })
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
    var productDictArray = await updateProductByInvoiceItems(items, typeStr).catch(err => {
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

    // 5. insert purchaseRefundItem
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