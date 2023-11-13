const express = require('express')
const router = express.Router()

const db = require('../db')


router.get('/partner/name/:name', (req, res) => {
    db.all(`SELECT name FROM partner WHERE name LIKE "%${req.params.name}%"`, (err, partners) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(partners.map(partner => partner.name))
    })
})

router.get('/product/material/:material', (req, res) => {
    db.all(`SELECT DISTINCT material FROM product WHERE material LIKE "%${req.params.material}%"`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(products.map(product => product.material))
    })
})

router.get('/product/name/:name', (req, res) => {
    db.all(`SELECT DISTINCT name FROM product WHERE name LIKE "%${req.params.name}%"`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(products.map(product => product.name))
    })
})

router.get('/product/spec/:spec', (req, res) => {
    db.all(`SELECT DISTINCT spec FROM product WHERE spec LIKE "%${req.params.spec}%"`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(products.map(product => product.spec))
    })
})



module.exports = router