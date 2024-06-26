const express = require('express')
const router = express.Router()
const { pinyin } = require('pinyin-pro')


const db = require('../db')


const matchSort = (array, keyword) => {
    return array.filter(name => 
        name.includes(keyword) ||
        pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(keyword) ||
        pinyin(name, { toneType: 'none', type: 'array' }).join('').includes(keyword)
    ).sort((a, b) => a.length - b.length)
}


router.get('/partner/name/:name', (req, res) => {
    db.all(`SELECT name FROM partner`, (err, partners) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(matchSort(partners.map(partner => partner.name), req.params.name))
    })
})


router.get('/product/material/:material', (req, res) => {
    db.all(`SELECT DISTINCT material FROM product`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(matchSort(products.map(product => product.material), req.params.material))
    })
})

router.get('/product/name/:name', (req, res) => {
    db.all(`SELECT DISTINCT name FROM product`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(matchSort(products.map(product => product.name), req.params.name))
    })
})

router.get('/product/spec/:spec', (req, res) => {
    db.all(`SELECT DISTINCT spec FROM product`, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).end()
            return
        }
        res.send(matchSort(products.map(product => product.spec), req.params.spec))
    })
})



module.exports = router