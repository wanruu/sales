const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal.js');

const db = require("../db")
const { formatInsert, updateProductQuantityByInfo, updateSalesRefundAmount, updateProductQuantityById } = require('./utils.js');


router.get('/', (req, res) => {
    const query = `SELECT * FROM salesRefund`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        res.send(rows)
    })
})


router.get('/id/:id', (req, res) => {
    db.each(`SELECT * FROM salesRefund WHERE id=${req.params.id}`, (err, refund) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        const query = `SELECT ri.id, p.id AS productId, oi.id AS orderItemId, p.material, p.name, p.spec, p.unit, oi.price, oi.discount, 
        ri.quantity, ri.originalAmount, ri.amount, ri.remark, ri.delivered 
        FROM salesRefundItem ri, salesOrderItem oi, product p
        WHERE ${req.params.id}=ri.refundId AND ri.orderItemId=oi.id AND oi.productId=p.id`
        db.all(query, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
            res.send(Object.assign(refund, { items: items }))
        })
    })
})


router.post('/', (req, res) => {
    // insert salesRefund
    const q1 = `INSERT INTO salesRefund (partner, date, amount, payment) 
    VALUES ("${req.body.partner}", "${req.body.date}", "${req.body.amount}", "${req.body.payment}")`
    db.run(q1, function(err) {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        const items = req.body.items.map(item => {
            return {
                orderItemId: item.orderItemId,
                quantity: item.quantity,
                originalAmount: item.originalAmount,
                amount: item.amount,
                remark: item.remark,
                delivered: 0,
                refundId: this.lastID
            }
        })
        req.body.items.forEach(item => {
            updateProductQuantityByInfo(item.material, item.name, item.spec, item.unit, item.quantity)
        })
        const { query, flatData } = formatInsert('INSERT', 'salesRefundItem', items, [])
        db.run(query, flatData, (err) => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
            res.send()
        })
    })
})


router.delete('/id/:id', async (req, res) => {
    const id = req.params.id  // str
    if (id === undefined) {
        res.status(400).send('Insufficient data')
        return
    }
    // 1. get product
    const productSelect = `SELECT productId,  ri.id AS itemId, p.quantity AS originalQuantity, ri.quantity changeQuantity 
    FROM salesOrderItem AS oi, product AS p, salesRefundItem AS ri 
    WHERE ri.refundId=${id} AND ri.orderItemId=oi.id AND oi.productId=p.id;`
    const products = await new Promise((resolve, reject) => { 
        db.all(productSelect, (err, products) => {
            if (err) {
                reject(err)
            } 
            resolve(products)
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send()
    })

    // ------- START TO UPDATE -------
    db.serialize(() => {
        // update product quantity
        products.forEach(row => {
            const newQuantity = Decimal(row.changeQuantity).minus(row.originalQuantity).toString()
            const updateQuantity = `UPDATE product SET quantity="${newQuantity}" WHERE id="${row.productId}";`
            db.run(updateQuantity)
        })
        // delete salesOrder
        db.run(`DELETE FROM salesRefund WHERE id=${id};`, err => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
            res.send()
        })
    })
})



router.put('/id/:id', async (req, res) => {
    const refundId = req.params.id
    // update salesRefund
    const updateRefund = `UPDATE salesRefund 
    SET partner="${req.body.partner}", date="${req.body.date}", amount="${req.body.amount}", payment="${req.body.payment}" 
    WHERE id=${refundId}`
    await new Promise((resolve, reject) => {
        db.run(updateRefund, function(err) {
            if (err) {
                reject(err)
            }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send()
        return
    })
    // delete old refund items
    await new Promise((resolve, reject) => {
        db.run(`DELETE FROM salesRefundItem WHERE refundId=${refundId}`, function(err) {
            if (err) {
                reject(err)
            }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send()
        return
    })
    // insert new refund items
    const items = req.body.items.map(item => {
        return {
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            originalAmount: item.originalAmount,
            amount: item.amount,
            remark: item.remark,
            delivered: item.delivered,
            refundId: refundId
        }
    })
    const { query, flatData } = formatInsert('INSERT', 'salesRefundItem', items, [])
    db.run(query, flatData, (err) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        // update product quantity
        const dict = {}
        req.body.items.forEach(item => {
            dict[item.productId] = Decimal(item.quantity)
        })
        req.body.oldItems.forEach(item => {
            if (dict[item.productId] === undefined) {
                dict[item.productId] = Decimal("-" + item.quantity)
            } else {
                dict[item.productId] = dict[item.productId].minus(item.quantity)
            }
        })
        for (const productId in dict) {
            updateProductQuantityById(productId, dict[productId])
        }
        res.send()
    })
})


module.exports = router