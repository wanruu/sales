const express = require("express")
const router = express.Router()
const Decimal = require('decimal.js');

const db = require("../db")


router.get('/', (req, res) => {
    const query = `SELECT * FROM partner`
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