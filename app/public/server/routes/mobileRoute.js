const express = require('express')
const router = express.Router()


router.get('/test', (req, res) => {
    res.send('<a href="http://192.168.31.251:8888/mobile/test2">test2</a>')
})


router.get('/test2', (req, res) => {
    res.send('<a href="http://192.168.31.251:8888/mobile/test2">test1</a>')
})


module.exports = router