const express = require('express')
const router = express.Router()



const db = require('../db')


router.get('/invoiceItem', (req, res) => {
    db.all('SELECT * FROM invoiceItem', (err, rows) => {
        res.send(rows)
    })
})


router.get('/salesOrderItem', (req, res) => {
    db.all('SELECT * FROM invoiceItem WHERE invoiceId LIKE "%XS%"', (err, rows) => {
        res.send(rows)
    })
})


router.get('/salesRefundItem', (req, res) => {
    db.all('SELECT * FROM invoiceItem WHERE invoiceId LIKE "%XT%"', (err, rows) => {
        res.send(rows)
    })
})



module.exports = router