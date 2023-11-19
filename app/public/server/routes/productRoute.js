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
    const query = `SELECT p.id, material, name, spec, unit, quantity, invoiceNum, quantity*unitWeight AS estimatedWeight
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
    
    const selectProduct = `SELECT * FROM product WHERE id="${productId}"`
    db.each(selectProduct, (err, product) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const selectItems = `SELECT i.partner, i.type,
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
    const query = `SELECT unit FROM product 
        WHERE material="${material}" AND name="${name}" AND spec="${spec}"`
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


router.get('/price/:material/:name/:spec', (req, res) => {
    // data
    const material = req.params.material
    const name = req.params.name
    const spec = req.params.spec
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