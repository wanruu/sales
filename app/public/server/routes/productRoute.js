const express = require('express')
const router = express.Router()
const crypto = require('crypto')

const db = require('../db')


router.get('/', async (req, res) => {
    const t1 = `(SELECT p.id, COUNT(*) AS invoiceNum 
        FROM product AS p, invoiceItem AS ii 
        WHERE p.id=ii.productId GROUP BY p.id)`
    const query = `SELECT p.id, material, name, spec, unit, quantity, invoiceNum
        FROM product AS p LEFT JOIN ${t1} AS t ON p.id=t.id`
    db.all(query, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(products)
    })
})


router.get('/unit/:material/:name/:spec', (req, res) => {
    const query = `SELECT unit FROM product 
    WHERE material="${req.params.material}" AND name="${req.params.name}" AND spec="${req.params.spec}"`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const unit = rows.length === 0 ? undefined : rows[0].unit
        res.send({ unit: unit })
    })
})


router.delete('/', (req, res) => {
    const ids = req.body.ids.map(id => `"${id}"`).join(', ')
    db.run(`DELETE FROM product WHERE id IN (${ids})`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


router.put('/id/:id', async (req, res) => {
    const productId = req.params.id
    const updates = ['material', 'name', 'spec', 'unit', 'quantity'].map(key => `${key}="${req.body[key]}"`).join(', ')
    const query = `UPDATE product SET ${updates} WHERE id="${productId}"`
    
    // 1. update product
    const data = await new Promise((resolve, reject) => {
        db.run(query, err => {
            if (err && err.errno === 19) { 
                resolve({ changes: 0, prompt: '产品重复' } )
            }
            if (err) {
                reject(err)
            }
            resolve({ changes: 1 })
        })
    })
    
    // 2. update invoice & invoice items (order & refund)
    if (req.body.unitRatio !== '1') {
        // update invoice items: amount & originalAmount
        const unitRatio = req.body.unit === '千件' ? 1000 : 1
        const updateInvoiceItem = `UPDATE invoiceItem
            SET originalAmount=invoiceItem.quantity*price*${unitRatio},
                amount=invoiceItem.quantity*price*${unitRatio}*discount/100
            FROM product AS p WHERE invoiceItem.productId=p.id`
        // update invoice: amount
        const updateInvoice = `UPDATE invoice
            SET amount=(SELECT SUM(amount) FROM invoiceItem WHERE invoiceItem.invoiceId=invoice.id)
            FROM invoiceItem AS ii
            WHERE ii.productId="${productId}" AND invoice.id=ii.invoiceId`
        db.run(updateInvoiceItem, err => {
            if (err) { 
                console.error(err)
                res.status(500).send(err)
                return
            }
            db.run(updateInvoice, err => {
                if (err) { 
                    console.error(err)
                    res.status(500).send(err)
                    return
                }
                res.send(data)
            })
        })
    } else {
        res.send(data)
    }
})


router.post('/', (req, res) => {
    const query = `INSERT INTO product (id, material, name, spec, quantity, unit) 
        VALUES ("${crypto.randomUUID()}", "${req.body.material}", "${req.body.name}", "${req.body.spec}", "${req.body.quantity}", "${req.body.unit}")`
    db.run(query, err => {
        if (err && err.errno === 19) { 
            console.error(err)
            res.send({ changes: 0, prompt: '产品重复' })
            return
        }
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send({ changes: 1 })
    })
})


module.exports = router