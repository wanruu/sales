const express = require("express")
const router = express.Router()
const Decimal = require('decimal.js');
const crypto = require('crypto')


const db = require("../db")


router.get('/', async (req, res) => {
    const query = `SELECT p.id, p.material, p.name, p.spec, p.unit, p.quantity, COUNT(*) AS hasInvoice
    FROM product AS p LEFT JOIN invoiceItem AS ii
    ON p.id=ii.productId
    GROUP BY p.id`
    db.all(query, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(products.map(p => {
            p.hasInvoice = p.hasInvoice > 0
            return p
        }))
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


router.delete('/id/:id', (req, res) => {
    db.run(`DELETE FROM product WHERE id="${req.params.id}"`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
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
        }
        if (err) {
            res.status(500).end(err)
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
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


module.exports = router