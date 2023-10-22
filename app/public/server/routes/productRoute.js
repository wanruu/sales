const express = require("express")
const router = express.Router()
const Decimal = require('decimal.js');
const crypto = require('crypto')


const db = require("../db")


router.get('/', async (req, res) => {
    const products = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM product`, (err, products) => {
            if (err) { reject(err) }
            resolve(products)
        })
    }).catch(err => {
        console.error(err)
        res.status(500).end()
        return
    })
    products.forEach(p => {
        p.salesOrders = []; p.salesRefunds = []; p.purchaseOrders = []; p.purchaseRefunds = []
    })
    // sales orders
    await new Promise((resolve, reject) => {
        db.all(`SELECT i.orderId, p.id AS productId FROM product AS p, salesOrderItem AS i WHERE i.productId=p.id`, (err, salesOrders) => {
            if (err) { reject(err) }
            salesOrders.forEach(order => {
                const p = products.find(p => p.id === order.productId)
                p.salesOrders.push(order)
            });
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).end()
        return
    })
    // sales refunds
    await new Promise((resolve, reject) => {
        const query = `SELECT ri.refundId, p.id AS productId 
        FROM product AS p, salesOrderItem AS oi, salesRefundItem AS ri WHERE oi.productId=p.id AND oi.id=ri.orderItemId`
        db.all(query, (err, salesRefunds) => {
            if (err) { reject(err) }
            salesRefunds.forEach(refund => {
                const p = products.find(p => p.id === refund.productId)
                p.salesRefunds.push(refund)
            });
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).end()
        return
    })
    // TODO: purchase order
    // TODO: purchase refund
    res.send(products)
})


router.get('/unit/:material/:name/:spec', (req, res) => {
    const query = `SELECT unit FROM product 
    WHERE material="${req.params.material}" AND name="${req.params.name}" AND spec="${req.params.spec}"`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        const unit = rows.length === 0 ? undefined : rows[0].unit
        res.send({ unit: unit })
    })
})


router.delete('/id/:id', (req, res) => {
    db.run(`DELETE from product WHERE id="${req.params.id}"`, err => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        res.end()
    })
})


router.put('/id/:id', (req, res) => {
    const updates = ['material', 'name', 'spec', 'unit', 'quantity'].map(key => 
        `${key}="${req.body[key]}"`
    ).join(', ')
    const query = `UPDATE product SET ${updates} WHERE id="${req.params.id}"`
    
    db.run(query, err => {
        if (err && err.errno === 19) { 
            res.send({ changes: 0, prompt: '产品重复' } ) 
            return
        } else if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send({ changes: 1 })
    })
})


router.post('/', (req, res) => {
    const query = `INSERT INTO product (id, material, name, spec, quantity) 
    VALUES ("${crypto.randomUUID()}", "${req.body.material}", "${req.body.name}", "${req.body.spec}", "${req.body.quantity}")`
    db.run(query, err => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.end()
    })
})


module.exports = router