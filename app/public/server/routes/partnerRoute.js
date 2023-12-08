const express = require('express')
const router = express.Router()

const db = require('../db')
const { INVOICE_TYPE_2_INT, INT_2_INVOICE_TYPE } = require('./utils')
const salesOrderType = INVOICE_TYPE_2_INT.salesOrder
const salesRefundType = INVOICE_TYPE_2_INT.salesRefund
const purchaseOrderType = INVOICE_TYPE_2_INT.purchaseOrder
const purchaseRefundType = INVOICE_TYPE_2_INT.purchaseRefund


router.get('/', (req, res) => {
    const t = `SELECT p.name, COUNT(*) AS invoiceNum
        FROM partner AS p, invoiceItem AS ii, invoice AS i 
        WHERE p.name=i.partner AND ii.invoiceId=i.id 
        GROUP BY p.name`

    const query = `SELECT p.*, invoiceNum 
        FROM partner AS p LEFT JOIN (${t}) AS t ON p.name=t.name`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(rows)
    })
})


router.get('/name/:name', (req, res) => {
    const name = req.params.name
    // Products
    const selectItems = `SELECT ii.productId, ii.quantity, ii.amount,
        CASE WHEN i.type=${salesOrderType} THEN ii.quantity ELSE 0 END AS salesOrderQuantity,
        CASE WHEN i.type=${salesRefundType} THEN ii.quantity ELSE 0 END AS salesRefundQuantity,
        CASE WHEN i.type=${purchaseOrderType} THEN ii.quantity ELSE 0 END AS purchaseOrderQuantity,
        CASE WHEN i.type=${purchaseRefundType} THEN ii.quantity ELSE 0 END AS purchaseRefundQuantity,
        CASE WHEN i.type=${salesOrderType} THEN ii.amount ELSE 0 END AS salesOrderAmount,
        CASE WHEN i.type=${salesRefundType} THEN ii.amount ELSE 0 END AS salesRefundAmount,
        CASE WHEN i.type=${purchaseOrderType} THEN ii.amount ELSE 0 END AS purchaseOrderAmount,
        CASE WHEN i.type=${purchaseRefundType} THEN ii.amount ELSE 0 END AS purchaseRefundAmount
        FROM invoice AS i, invoiceItem AS ii
        WHERE i.partner="${name}" AND i.id=ii.invoiceId`
    const selectProducts = `SELECT p.id, p.material, p.name, p.spec, p.unit,
        SUM(ii.salesOrderQuantity-ii.salesRefundQuantity) AS salesQuantity,
        SUM(ii.salesRefundQuantity) AS salesRefundQuantity,
        SUM(ii.salesOrderAmount-ii.salesRefundAmount)/SUM(ii.salesOrderQuantity-ii.salesRefundQuantity) AS salesPrice,
        SUM(ii.purchaseOrderQuantity-ii.purchaseRefundQuantity) AS purchaseQuantity,
        SUM(ii.purchaseRefundQuantity) AS purchaseRefundQuantity,
        SUM(ii.purchaseOrderAmount-ii.purchaseRefundAmount)/SUM(ii.purchaseOrderQuantity-ii.purchaseRefundQuantity) AS purchasePrice
        FROM (${selectItems}) AS ii, product AS p
        WHERE ii.productId=p.id
        GROUP BY p.id`
    // Invoices
    const selectInvoices = `SELECT CASE WHEN oi.type=${salesOrderType} THEN 'sales' ELSE 'purchase' END AS type,
        oi.id AS orderId, oi.amount AS orderAmount, oi.prepayment AS orderPrepayment, oi.payment AS orderPayment,
        ri.id AS refundId, ri.amount AS refundAmount, ri.prepayment AS refundPrepayment, ri.payment AS refundPayment
        FROM invoice AS oi LEFT JOIN (invoiceRelation AS r, invoice AS ri)
        ON oi.id=r.orderId AND ri.id=r.refundId
        WHERE oi.type IN (${salesOrderType}, ${purchaseOrderType}) AND oi.partner="${name}"`
    // InvoiceItems
    const selectInvoiceItems = `SELECT CASE WHEN oi.type=${salesOrderType} THEN 'sales' ELSE 'purchase' END AS type,
        p.id AS productId, p.material, p.name, p.spec, p.unit, 
        oii.invoiceId AS orderId, oii.quantity AS orderQuantity, oii.price, oii.discount, oii.originalAmount AS orderOriginalAmount, oii.amount AS orderAmount, oii.remark AS orderRemark,
        rii.invoiceId AS refundId, rii.quantity AS refundQuantity, rii.originalAmount AS refundOriginalAmount, rii.amount AS refundAmount, rii.remark AS refundRemark
        FROM invoice AS oi, invoiceItem AS oii, product AS p
        LEFT JOIN (invoiceRelation r, invoiceItem AS rii)
        ON r.orderId=oi.id AND r.refundId=rii.invoiceId AND rii.productId=p.id 
        WHERE oi.type IN (${salesOrderType}, ${purchaseOrderType}) AND oi.partner="${name}" AND oi.id=oii.invoiceId AND oii.productId=p.id`
    
    db.each(`SELECT * FROM partner WHERE name="${name}"`, (err, partner) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        db.all(selectProducts, (err, products) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            partner.products = products
            db.all(selectInvoices, (err, invoices) => {
                if (err) {
                    console.error(err)
                    res.status(500).send(err)
                    return
                }
                partner.invoices = invoices
                db.all(selectInvoiceItems, (err, invoiceItems) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send(err)
                        return
                    }
                    partner.invoiceItems = invoiceItems
                    res.send(partner)
                })
            })
        })
    })
})


router.delete('/', (req, res) => {
    const names = (req.body.names || []).map(name => `"${name}"`).join(', ')
    db.run(`DELETE FROM partner WHERE name IN (${names})`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


router.post('/', (req, res) => {
    const name = req.body.name
    const phone = req.body.phone
    const address = req.body.address
    const folder = req.body.folder

    const query = `INSERT INTO partner(name, phone, address, folder) 
        VALUES ("${name}", "${phone}", "${address}", "${folder}")`
    db.run(query, err => {
        if (err && err.errno === 19) {
            res.send({ changes: 0, prompt: '姓名重复' })
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


router.put('/name/:name', (req, res) => {
    // ----- data -----
    const name = req.body.name
    const phone = req.body.phone
    const address = req.body.address
    const folder = req.body.folder
    const originalName = req.params.name

    if (name === originalName) {
        const query = `UPDATE partner 
            SET phone="${phone}", address="${address}", folder="${folder}" 
            WHERE name="${name}"`
        db.run(query, err => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            res.send({ changes: 1 })
        })
    } else {
        // create new partner
        const insertPartner = `INSERT INTO partner(name, phone, address, folder) 
            VALUES ("${name}", "${phone}", "${address}", "${folder}")`
        db.run(insertPartner, err => {
            if (err && err.errno === 19) {
                res.send({ changes: 0, prompt: '姓名重复' })
                return
            }
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            // update invoice partner
            const updateInvoice = `UPDATE invoice SET partner="${name}" WHERE partner="${originalName}"`
            db.run(updateInvoice, err => {
                if (err) {
                    console.error(err)
                    res.status(500).send(err)
                    return
                }
                // delete old partner
                db.run(`DELETE FROM partner WHERE name="${originalName}"`, err => {
                    if (err) {
                        console.error(err)
                        res.status(500).send(err)
                        return
                    }
                    res.send({ changes: 1 })
                })
            })
        })
    }
})

module.exports = router