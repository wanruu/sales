const express = require("express")
const router = express.Router()

const db = require("../db")

router.all('*', (req, res, next) => {
    console.log('Router: outBill')
    next()
})

router.get('/', (req, res) => {
    res.send('test')
})

module.exports = router