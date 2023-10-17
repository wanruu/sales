const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal.js');

const db = require("../db")
const { formatInsert } = require('./utils.js')


router.post('/', (req, res) => {
    // data
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount
    const prepayment = req.body.prepayment
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
                        quantity: (new Decimal(matchedProduct.quantity)).minus(item.quantity).toString(),
                        orderInfo: item
                    }
                })
                const productFieldnames = ['id', 'material', 'name', 'spec', 'unit', 'quantity']
                const { query, flatData } = formatInsert('INSERT OR REPLACE', 'product', productDictArray, productFieldnames)
                db.run(query, flatData, err => {
                    if (err) {
                        console.error(err)
                        res.status(500).send()
                        return
                    }
                })
                
                // 4. insert salesOrder
                const orderInsert = `INSERT INTO salesOrder (partner, date, amount, prepayment, payment) VALUES 
                ("${partner}", "${date}", "${amount}", "${prepayment}", "0")`
                db.run(orderInsert, function(err) {
                    if (err) {
                        console.error(err)
                        res.status(500).send()
                        return
                    }
                    const orderId = this.lastID
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
                    const { query, flatData } = formatInsert('INSERT', 'salesOrderItem', orderItemDictArray, [])
                    db.run(query, flatData, err => {
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

router.get('/id/:id', (req, res) => {
    const id = req.params.id  // str
    if (id === undefined) {
        res.status(400).send('Insufficient data')
        return
    }

    const orderSelect = `SELECT * FROM salesOrder WHERE id=${id};`
    db.all(orderSelect, (err, orders) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        if (orders.length === 0) {
            res.status(404).send('No salesOrder')
            return
        }
        
        const itemSelect = `SELECT i.id AS id, productId, price, discount, i.quantity AS quantity, originalAmount, amount, remark, delivered, orderId, 
        material, name, spec, unit, p.quantity AS remainingQuantity 
        FROM salesOrderItem AS i, product AS p 
        WHERE i.orderId=${id} AND p.id=i.productId;`
        db.all(itemSelect, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send()
                return
            }
            res.send(Object.assign(orders[0], {items: items}))
        })
    })
})

router.delete('/id/:id', (req, res) => {
    const id = req.params.id  // str
    if (id === undefined) {
        res.status(400).send('Insufficient data')
        return
    }
    // update product
    // TODO: update salesRefund
    const itemSelect = `SELECT productId, p.quantity AS originalQuantity, i.quantity changeQuantity 
    FROM salesOrderItem AS i, product AS p 
    WHERE i.orderId=${id} AND i.productId=p.id`
    db.all(itemSelect, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        db.serialize(() => {
            if (rows.length > 0) {
                rows.forEach(row => {
                    const newQuantity = Decimal(row.changeQuantity).plus(row.originalQuantity).toString()
                    // console.log(row, newQuantity)
                    const updateQuantity = `UPDATE product SET quantity="${newQuantity}" WHERE id="${row.productId}";`
                    db.run(updateQuantity, err => {
                        if (err) {
                            console.error(err)
                            res.status(500).send()
                            return
                        }
                    })
                })
            }
            db.run(`DELETE FROM salesOrder WHERE id=${id};`, err => {
                if (err) {
                    console.error(err)
                    res.status(500).send()
                    return
                }
                res.send()
            })
        })
    })
})

module.exports = router