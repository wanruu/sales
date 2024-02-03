const express = require('express')
const router = express.Router()
const crypto = require('crypto')

const db = require('../db')
const { INVOICE_TYPE_2_INT, INT_2_INVOICE_TYPE } = require('./utils')


router.get('/', (req, res) => {
    const invoiceItemNum = `SELECT productId, COUNT(*) AS invoiceNum 
        FROM invoiceItem GROUP BY productId`
    const unitWeight = `SELECT productId, IFNULL(SUM(weight)/SUM(quantity),0) AS unitWeight
        FROM invoiceItem
        WHERE weight IS NOT NULL
        GROUP BY productId`
    const query = `SELECT p.id, material, name, spec, unit, invoiceNum
        FROM product AS p 
        LEFT JOIN (${invoiceItemNum}) AS t ON p.id=t.productId
        LEFT JOIN (${unitWeight}) AS u ON p.id=u.productId`
    db.all(query, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(products)
    })
})

router.get('/id/:id', (req, res) => {
    const productId = req.params.id
    
    const quantityChange = `SELECT 
        CASE WHEN i.type IN (${INVOICE_TYPE_2_INT.salesOrder}, ${INVOICE_TYPE_2_INT.purchaseRefund}) THEN -ii.quantity
        ELSE ii.quantity END AS quantityChange
    FROM invoiceItem AS ii, invoice AS i
    WHERE ii.invoiceId=i.id AND ii.productId="${productId}"`
    const selectProduct = `SELECT p.*, SUM(c.quantityChange) AS quantity
    FROM product AS p, (${quantityChange}) AS c
    WHERE p.id="${productId}"`
    db.each(selectProduct, (err, product) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const selectItems = `SELECT i.partner, i.type, i.date,
            ii.invoiceId, ii.price, ii.quantity, ii.originalAmount, ii.discount, ii.amount, ii.remark, ii.weight
            FROM invoiceItem AS ii, invoice AS i
            WHERE ii.productId="${productId}" AND i.id=ii.invoiceId`
        db.all(selectItems, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            product.items = items.map(item => {
                item.type = INT_2_INVOICE_TYPE[item.type]
                return item
            })
            res.send(product)
        })
    })
})


router.get('/unit', (req, res) => {
    const material = req.query.material
    const name = req.query.name
    const spec = req.query.spec
    const query = `SELECT id AS productId, unit FROM product 
        WHERE material="${material}" AND name="${name}" AND spec="${spec}"`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(rows?.[0] || {})
    })
})


router.get('/price', (req, res) => {
    // data
    const material = req.query.material
    const name = req.query.name
    const spec = req.query.spec
    const salesOrderType = INVOICE_TYPE_2_INT.salesOrder
    const purchaseOrderType = INVOICE_TYPE_2_INT.purchaseOrder
    // sales order
    const selectQuery = `SELECT i.partner, i.date, i.id,
            CASE WHEN i.type=${salesOrderType} THEN 'salesOrder' ELSE 'purchaseOrder' END AS type,
            ii.quantity, p.unit, ii.price, ii.discount, ii.originalAmount, ii.amount, ii.remark
        FROM invoiceItem AS ii, product AS p, invoice AS i
        WHERE p.material="${material}" AND name="${name}" AND spec="${spec}" 
            AND ii.productId=p.id AND ii.invoiceId=i.id 
            AND (i.type=${salesOrderType} OR i.type=${purchaseOrderType})
        ORDER BY i.id DESC`
    db.all(selectQuery, (err, items) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(items)
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
    const updates = ['material', 'name', 'spec', 'unit'].map(key => `${key}="${req.body[key]}"`).join(', ')
    const query = `UPDATE product SET ${updates} WHERE id="${productId}"`
    
    // update product
    db.run(query, err => {
        if (err && err.errno === 19) { 
            res.send({ changes: 0, prompt: '产品重复' } )
        } else if (err) {
            console.error(err)
            res.status(500).send(err)
        } else {
            res.send({ changes: 1 })
        }
    })
})


router.post('/', (req, res) => {
    const query = `INSERT INTO product (id, material, name, spec, unit) 
        VALUES ("${crypto.randomUUID()}", "${req.body.material}", "${req.body.name}", "${req.body.spec}", "${req.body.unit}")`
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