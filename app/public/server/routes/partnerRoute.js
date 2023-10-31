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


router.delete('/:name', (req, res) => {
    db.run(`DELETE FROM partner WHERE name="${req.params.name}"`, err => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.end()
    })
})


router.post('/', (req, res) => {
    const query = `INSERT INTO partner(name, phone, address) 
    VALUES ("${req.body.name}", "${req.body.phone}", "${req.body.address}")`
    db.run(query, err => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.end()
    })
})


router.put('/', (req, res) => {
    const query = `UPDATE partner SET name="${req.body.name}", phone="${req.body.phone}", address="${req.body.address}" 
    WHERE name="${req.body.originalName}"`
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