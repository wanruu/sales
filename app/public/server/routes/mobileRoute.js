const express = require('express')
const router = express.Router()

const db = require('../db')


function renderTable(columns, data, no='#') {
    const header = (no ? `<th>${no}</th>` : null) + columns.map(col => `<th>${col.title}</th>`).join('')
    const content = data.map((item, idx) => {
        const tmp = columns.map(col => `<td>${item[col.dataIndex]}</td>`).join('')
        return `<tr>${no ? `<th>${idx+1}</th>` : null}${tmp}</tr>`
    }).join('')
    return `<table class="table"><tr>${header}</tr>${content}</table>`
}


router.get('/product', (req, res) => {
    const invoiceItemNum = `SELECT productId, COUNT(*) AS invoiceNum 
        FROM invoiceItem GROUP BY productId`
    const unitWeight = `SELECT productId, IFNULL(SUM(weight)/SUM(quantity),0) AS unitWeight
        FROM invoiceItem
        WHERE weight IS NOT NULL
        GROUP BY productId`
    const query = `SELECT p.id, material, name, spec, unit, quantity, invoiceNum, ROUND(quantity*unitWeight,2) AS estimatedWeight
        FROM product AS p 
        LEFT JOIN (${invoiceItemNum}) AS t ON p.id=t.productId
        LEFT JOIN (${unitWeight}) AS u ON p.id=u.productId`
    db.all(query, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        products = products.map(p => {
            if (p.estimatedWeight == null) {
                p.estimatedWeight = ''
            }
            return p
        })
        const columns = [
            { title: '材质', dataIndex: 'material'},
            { title: '名称', dataIndex: 'name'},
            { title: '规格', dataIndex: 'spec'},
            { title: '数量', dataIndex: 'quantity'},
            { title: '单位', dataIndex: 'unit'},
            { title: '预估重量', dataIndex: 'estimatedWeight'},
        ]
        res.send(renderTable(columns, products))
    })
})


router.get('/test2', (req, res) => {
    res.send('<a href="http://192.168.31.251:8888/mobile/test2">test1</a>')
})


module.exports = router