const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal')

const db = require("../db")
const utils = require('./utils')


router.post('/', (req, res) => {
    // data
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount
    const items = req.body.items || []
    
    // validate
    if (partner === undefined || date === undefined || amount === undefined) {
        res.status(400).send('Insufficient data')
        return
    }
    if ((/(\d{4})-(\d{2})-(\d{2})/g).exec(date) === null) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    db.serialize(() => {
        // 1. insert partner
        const partnerInsert = `INSERT OR IGNORE INTO partner (name, phone, address) VALUES ("${partner}", "", "");`
        db.run(partnerInsert, err => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
        })
        
        // if items = []
        if (items.length === 0) {
            const orderInsert = `INSERT INTO salesOrder (partner, date, amount, prepayment, payment) VALUES 
            ("${partner}", "${date}", "${amount}", "0", "0")`
            db.run(orderInsert, err => {
                if (err) {
                    console.error(err)
                    res.status(500).send()
                    return
                }
                res.send()
            })
        } else {
            // 2. get existing products
            const productSelectConditions = items.map(item => `("${item.material}", "${item.name}", "${item.spec}")`).join(', ')
            const productSelect = `SELECT * FROM product WHERE (material, name, spec) IN (VALUES ${productSelectConditions});`
            db.all(productSelect, (err, products) => {
                if (err) {
                    console.error(err)
                    res.status(500).send()
                    return
                }

                // 3. insert/update products
                const productDictArray = items.map(item => {
                    const matchedProduct = products.find(p => p.material === item.material && p.name === item.name && p.spec === item.spec)
                    if (matchedProduct === undefined) {
                        return {
                            id: crypto.randomUUID(),
                            material: item.material,
                            name: item.name, 
                            spec: item.spec, 
                            unit: item.unit,
                            quantity: `-${item.quantity}`,
                            orderInfo: item
                        }
                    }
                    return {
                        id: matchedProduct.id,
                        material: item.material,
                        name: item.name,
                        spec: item.spec,
                        unit: item.unit,
                        quantity: Decimal(matchedProduct.quantity).sub(item.quantity).toString(),
                        orderInfo: item
                    }
                })
                const productFieldnames = ['id', 'material', 'name', 'spec', 'unit', 'quantity']
                const {productUpdate, productFlatData} = utils.formatInsert('INSERT OR REPLACE', 'product', productDictArray, productFieldnames)
                db.run(productUpdate, productFlatData, err => {
                    if (err) {
                        console.error(err)
                        res.status(500).send()
                        return
                    }
                })
                
                // 4. insert salesOrder
                const orderInsert = `INSERT INTO salesOrder (partner, date, amount, prepayment, payment) VALUES 
                ("${partner}", "${date}", "${amount}", "0", "0")`
                db.run(orderInsert, err => {
                    if (err) {
                        console.error(err)
                        res.status(500).send()
                        return
                    }
                    const orderId = this.lastId
                    // 5. insert salesOrderItem
                    const orderItemDictArray = productDictArray.map(productDict => {
                        return {
                            productId: productDict.id,
                            price: productDict.orderInfo.price,
                            discount: productDict.orderInfo.discount,
                            quantity: productDict.orderInfo.quantity,
                            originalAmount: productDict.orderInfo.originalAmount,
                            amount: productDict.orderInfo.amount,
                            remark: productDict.orderInfo.remark,
                            delivered: 0,
                            orderId: orderId
                        }
                    })
                    const {orderItemInsert, orderItemFlatData} = utils.formatInsert('INSERT', 'salesOrderItem', orderItemDictArray, [])
                    db.run(orderItemInsert, orderItemFlatData, err => {
                        if (err) {
                            console.error(err)
                            res.status(500).send()
                            return
                        }
                    })

                    // 6. return
                    res.send()
                })
            })
        }
    })
})

router.get('/', (req, res) => {
    const query = `SELECT * FROM salesOrder`
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