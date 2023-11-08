const express = require("express")
const router = express.Router()


const db = require("../db")
const { formatInsert, getNextInvoiceId, updateProductByInvoiceItems,calQuanByInvoiceType,
    INVOICE_TYPE_2_INT
} = require('./utils.js');


const prefix = 'XT'
const typeStr = 'salesRefund'
const typeInt = INVOICE_TYPE_2_INT.salesRefund


router.get('/', (req, res) => {
    const query = `SELECT * 
        FROM invoice AS i LEFT JOIN invoiceRelation AS r ON i.id=r.refundId
        WHERE type=${typeInt}`
    db.all(query, (err, refunds) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        // get delivered
        const q = `SELECT invoiceId, COUNT(*) AS itemNum, SUM(delivered) AS deliveredNum FROM invoiceItem GROUP BY invoiceId`
        db.all(q, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
            items.forEach(item => {
                const refund = refunds.find(refund => refund.id === item.invoiceId)
                if (refund) 
                    refund.delivered = item.itemNum === item.deliveredNum ? '全部配送' : (item.deliveredNum === 0 ? '未配送' : '部分配送')
            })
            res.send(refunds)
        })
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
        const query = `SELECT ii.id AS invoiceItemId, productId, material, name, spec, unit, p.quantity AS remainingQuantity, 
        price, discount, ii.quantity, originalAmount, amount, remark, delivered 
        FROM invoiceItem ii, product p
        WHERE ii.invoiceId="${refundId}" AND ii.productId=p.id`
        db.all(query, (err, items) => {
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
    const items = req.body.items
    const orderId = req.body.orderId

    // ---------- validate ----------
    if (partner === undefined || date === undefined || amount === undefined || orderId === undefined || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if ((/(\d{4})-(\d{2})-(\d{2})/g).exec(date) === null) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. update products
    var productDictArray = await updateProductByInvoiceItems(items, typeStr).catch(err => {
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
    res.end()
})


router.delete('/', async (req, res) => {
    const ids = (req.body.ids || []).map(id => `"${id}"`).join(', ');
    // 1. update product quantity
    const refundItems = await new Promise((resolve, reject) => {
        const query = `SELECT p.id AS productId, p.quantity AS originalQuantity, ii.quantity  
            FROM invoice i, invoiceItem ii, product p 
            WHERE i.id IN (${ids}) AND i.id=ii.invoiceId AND ii.productId=p.id`
        db.all(query, (err, items) => {
            if (err) { reject(err) }
            resolve(items)
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    const newQuanDict = refundItems.reduce((pre, item) => {
        const productId = item.productId
        pre[productId] = calQuanByInvoiceType(pre[productId] || item.originalQuantity, item.quantity, typeStr, true).toString()
        return pre
    }, {})
    Object.keys(newQuanDict).forEach(async productId => {
        const query = `UPDATE product SET quantity="${newQuanDict[productId]}" WHERE id="${productId}"`
        await new Promise((resolve, reject) => {
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    })

    // 2. delete sales refund
    db.run(`DELETE FROM invoice WHERE id IN (${ids})`, err => {
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
    const amount = req.body.amount
    const date = req.body.date
    const items = req.body.items
    const payment = req.body.payment || '0'
    const prepayment = req.body.prepayment || '0'

    // ---------- validate ----------
    if (partner === undefined || date === undefined || amount === undefined || newOrderId === undefined || items.length === 0) {
        res.status(400).send('Insufficient data')
        return
    }
    if ((/(\d{4})-(\d{2})-(\d{2})/g).exec(date) === null) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. find old items & delete items & update product
    const selectItems = `SELECT p.id AS productId, p.quantity AS originalQuantity, ii.quantity  
    FROM invoiceItem AS ii, product AS p 
    WHERE ii.invoiceId="${refundId}" AND ii.productId=p.id`
    const oldItems = await new Promise((resolve, reject) => {
        db.all(selectItems, (err, items) => {
            if (err) { reject(err) }
            db.run(`DELETE FROM invoiceItem WHERE invoiceId="${refundId}"`, err => {
                if (err) { reject(err) }
                resolve(items)
            })
        })
    }).catch(err => {
        res.status(500).send(err)
    })
    oldItems.forEach(async item => {
        const newQuan = calQuanByInvoiceType(item.originalQuantity, item.quantity, typeStr, true)
        const query = `UPDATE product SET quantity="${newQuan}" WHERE id="${item.productId}"`
        await new Promise((resolve, reject) => {
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            res.status(500).send(err)
        })
    })

    // 2. update refund info
    const updateRefund = `UPDATE invoice SET amount="${amount}", date="${date}", partner="${partner}", 
    prepayment="${prepayment}", payment="${payment}"`
    await new Promise((resolve, reject) => {
        db.run(updateRefund, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
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