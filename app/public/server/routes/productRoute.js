const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal.js');

const db = require("../db")
const { formatInsert } = require('./utils.js')


router.get('/', (req, res) => {
    const query = `SELECT * FROM product`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        res.send(rows)
    })
})


module.exports = router