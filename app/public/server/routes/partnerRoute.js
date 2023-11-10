const express = require('express')
const router = express.Router()
const Decimal = require('decimal.js')

const db = require('../db')


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
    const query = `INSERT INTO partner(name, phone, address) 
    VALUES ("${req.body.name}", "${req.body.phone}", "${req.body.address}")`
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
    const originalName = req.params.name

    if (name === originalName) {
        const query = `UPDATE partner SET phone="${phone}", address="${address}" WHERE name="${name}"`
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
        const insertPartner = `INSERT INTO partner(name, phone, address) VALUES ("${name}", "${phone}", "${address}")`
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