const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal.js');

const db = require("../db")
const { formatInsert, updateProductQuantityByInfo, updateProductQuantityById,
    getNextInvoiceId, updateProductByInvoiceItems,calQuanByInvoiceType,
    INVOICE_TYPE_2_INT
} = require('./utils.js');


const prefix = 'XT'
const typeStr = 'salesRefund'
const typeInt = INVOICE_TYPE_2_INT.salesRefund


router.get('/', (req, res) => {
    const query = `SELECT * FROM invoice WHERE type=${typeInt}`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(rows)
    })
})


router.get('/id/:id', (req, res) => {
    const refundId = req.params.id
    db.each(`SELECT * FROM invoice WHERE id="${refundId}"`, (err, refund) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const query = `SELECT ii.id, productId, material, name, spec, unit, p.quantity AS remainingQuantity, 
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
            delivered: 0,
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


router.delete('/id/:id', async (req, res) => {
    const refundId = req.params.id  // str
    if (refundId === undefined) {
        res.status(400).send('Insufficient data')
        return
    }

    // 1. update product quantity
    const refundItems = await new Promise((resolve, reject) => {
        const query = `SELECT p.id AS productId, p.quantity AS originalQuantity, ii.quantity  
        FROM invoice i, invoiceItem ii, product p 
        WHERE i.id="${refundId}" AND i.id=ii.invoiceId AND ii.productId=p.id`
        db.all(query, (err, items) => {
            if (err) { reject(err) }
            resolve(items)
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    refundItems.forEach(async item => {
        const newQuan = calQuanByInvoiceType(item.originalQuantity, item.quantity, typeStr, true).toString()
        const query = `UPDATE product SET quantity="${newQuan}" WHERE id="${item.productId}"`
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
    db.run(`DELETE FROM invoice WHERE id="${refundId}"`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})



// router.put('/id/:id', async (req, res) => {
//     const refundId = req.params.id
//     // update salesRefund
//     const updateRefund = `UPDATE salesRefund 
//     SET partner="${req.body.partner}", date="${req.body.date}", amount="${req.body.amount}", payment="${req.body.payment}" 
//     WHERE id=${refundId}`
//     await new Promise((resolve, reject) => {
//         db.run(updateRefund, function(err) {
//             if (err) {
//                 reject(err)
//             }
//             resolve()
//         })
//     }).catch(err => {
//         console.error(err)
//         res.status(500).send()
//         return
//     })
//     // delete old refund items
//     await new Promise((resolve, reject) => {
//         db.run(`DELETE FROM salesRefundItem WHERE refundId=${refundId}`, function(err) {
//             if (err) {
//                 reject(err)
//             }
//             resolve()
//         })
//     }).catch(err => {
//         console.error(err)
//         res.status(500).send()
//         return
//     })
//     // insert new refund items
//     const items = req.body.items.map(item => {
//         return {
//             orderItemId: item.orderItemId,
//             quantity: item.quantity,
//             originalAmount: item.originalAmount,
//             amount: item.amount,
//             remark: item.remark,
//             delivered: item.delivered,
//             refundId: refundId
//         }
//     })
//     const { query, flatData } = formatInsert('INSERT', 'salesRefundItem', items, [])
//     db.run(query, flatData, (err) => {
//         if (err) {
//             console.error(err)
//             res.status(500).send()
//             return
//         }
//         // update product quantity
//         const dict = {}
//         req.body.items.forEach(item => {
//             dict[item.productId] = Decimal(item.quantity)
//         })
//         req.body.oldItems.forEach(item => {
//             if (dict[item.productId] === undefined) {
//                 dict[item.productId] = Decimal("-" + item.quantity)
//             } else {
//                 dict[item.productId] = dict[item.productId].minus(item.quantity)
//             }
//         })
//         for (const productId in dict) {
//             updateProductQuantityById(productId, dict[productId])
//         }
//         res.send()
//     })
// })


module.exports = router