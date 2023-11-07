const express = require("express")
const router = express.Router()


const db = require("../db")
const { formatInsert, updatePartner, updateProductByInvoiceItems, getNextInvoiceId,
    INVOICE_TYPE_2_INT, calQuanByInvoiceType
} = require('./utils.js');


const prefix = 'XS'
const typeStr = 'salesOrder'
const typeInt = INVOICE_TYPE_2_INT.salesOrder


/*
    item: { productId, price, discount, quantity, originalAmount, amount, remark }
*/
router.post('/', async (req, res) => {
    // ---------- data ----------
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount
    const prepayment = req.body.prepayment
    const payment = req.body.payment
    const items = req.body.items || []
    
    // ---------- validate ----------
    if (partner === undefined || date === undefined || amount === undefined) {
        res.status(400).send('Insufficient data')
        return
    }
    if ((/(\d{4})-(\d{2})-(\d{2})/g).exec(date) === null) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }
    // ---------- -------- ----------

    // 1. insert partner
    await updatePartner('INSERT OR IGNORE', partner, '', '').catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    
    // 2. insert salesOrder
    const orderId = await getNextInvoiceId(date, prefix).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    const orderInsert = `INSERT INTO invoice (id, type, partner, date, amount, prepayment, payment) VALUES 
    ("${orderId}", ${typeInt}, "${partner}", "${date}", "${amount}", "${prepayment}", "${payment}")`
    await new Promise((resolve, reject) => {
        db.run(orderInsert, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 2. insert/update products, insert salesOrderItem
    if (items.length > 0) {
        const productDictArray = await updateProductByInvoiceItems(items, typeStr).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
        const orderItemDictArray = productDictArray.map(productDict => {
            return {
                productId: productDict.id,
                price: productDict.info.price,
                discount: productDict.info.discount,
                quantity: productDict.info.quantity,
                originalAmount: productDict.info.originalAmount,
                amount: productDict.info.amount,
                remark: productDict.info.remark,
                delivered: 0,
                invoiceId: orderId
            }
        })
        const { query, flatData } = formatInsert('INSERT', 'invoiceItem', orderItemDictArray, [])
        await new Promise((resolve, reject) => { 
            db.run(query, flatData, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    }
    // 5. return
    res.end()
})

router.put('/id/:id', async (req, res) => {
    // data
    const orderId = req.params.id  // str
    const partner = req.body.partner
    const date = req.body.date
    const amount = req.body.amount
    const prepayment = req.body.prepayment || '0'
    const payment = req.body.payment || '0'
    const items = req.body.items || []

    if (orderId === undefined || partner === undefined || date === undefined || amount === undefined) {
        res.status(400).send('Insufficient data')
        return
    }
    if ((/(\d{4})-(\d{2})-(\d{2})/g).exec(date) === null) {
        res.status(400).send('Wrong data format, use MMMM-YY-DD')
        return
    }

    // 1. update partner
    const insertPartner = `INSERT OR IGNORE INTO partner (name) VALUES ("${partner}");`
    await new Promise((resolve, reject) => {
        db.run(insertPartner, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    
    // 2. update salesOrder
    const updateInvoice = `UPDATE invoice SET partner="${partner}", date="${date}", amount="${amount}", 
    prepayment="${prepayment}", payment="${payment}" WHERE id="${orderId}"`
    await new Promise((resolve, reject) => {
        db.run(updateInvoice, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    
    // 3. get original invoice items & delete
    const selectItems = `SELECT productId, p.quantity AS originalQuantity, ii.quantity 
    FROM invoiceItem AS ii, product AS p 
    WHERE ii.invoiceId="${orderId}" AND ii.productId=p.id`
    const oldInvoiceItems = await new Promise((resolve, reject) => {
        db.all(selectItems, (err, items) => {
            if (err) { reject(err) }
            db.run(`DELETE FROM invoiceItem WHERE invoiceId="${orderId}"`, err => {
                if (err) { reject(err) }
                resolve(items)
            })
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })

    // 4. update old product
    oldInvoiceItems.forEach(async item => {
        const newQuan = calQuanByInvoiceType(item.originalQuantity, item.quantity, typeStr, true)
        await new Promise((resolve, reject) => {
            db.run(`UPDATE product SET quantity="${newQuan}" WHERE id="${item.productId}"`, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    })

    // 5. insert new product & invoice items
    if (items.length > 0) {
        const productDictArray = await updateProductByInvoiceItems(items, typeStr).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
        const orderItemDictArray = productDictArray.map(productDict => {
            return {
                productId: productDict.id,
                price: productDict.info.price,
                discount: productDict.info.discount,
                quantity: productDict.info.quantity,
                originalAmount: productDict.info.originalAmount,
                amount: productDict.info.amount,
                remark: productDict.info.remark,
                delivered: 0,
                invoiceId: orderId
            }
        })
        const { query, flatData } = formatInsert('INSERT', 'invoiceItem', orderItemDictArray, [])
        await new Promise((resolve, reject) => { 
            db.run(query, flatData, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    }
    
    res.end()
})

router.get('/', (req, res) => {
    const query = `SELECT * 
    FROM invoice AS i LEFT JOIN invoiceRelation AS r ON i.id=r.orderId
    WHERE type=${typeInt}`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send()
            return
        }
        res.send(rows)
    })
})

router.get('/detailed', (req, res) => {
    db.all(`SELECT * FROM invoice WHERE type=${typeInt}`, (err, orders) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        
        const query = `SELECT i.invoiceId AS orderId, i.id AS orderItemId, 
        p.id AS productId, p.material, p.name, p.spec, p.unit, price, i.quantity, i.amount, discount, originalAmount, remark, delivered 
        FROM invoice o, invoiceItem i, product p 
        WHERE o.id=i.invoiceId AND p.id=productId AND o.type=${typeInt}`
        db.all(query, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            for (const item of items) {
                const order = orders.find(order => order.id === item.orderId)
                if (order.items === undefined) {
                    order.items = [item]
                } else {
                    order.items.push(item)
                }
            }
            res.send(orders)
        })
    })
})

router.get('/id/:id', (req, res) => {
    const orderId = req.params.id  // str
    if (orderId === undefined) {
        res.status(400).send('Insufficient data')
        return
    }

    const selectOrder = `SELECT * FROM invoice, partner WHERE id="${orderId}" AND partner=name`
    db.each(selectOrder, (err, order) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const itemSelect = `SELECT i.id, 
        productId, material, name, spec, unit, p.quantity AS remainingQuantity, 
        price, discount, i.quantity, originalAmount, amount, remark, delivered
        FROM invoiceItem AS i, product AS p 
        WHERE i.invoiceId="${orderId}" AND p.id=i.productId;`
        db.all(itemSelect, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            res.send(Object.assign(order, { items: items }))
        })
    })
})

router.delete('/', async (req, res) => {
    const ids = (req.body.ids || []).map(id => `"${id}"`).join(', ');

    // 1. update product quantity
    const orderItems = await new Promise((resolve, reject) => {
        const query = `SELECT p.id AS productId, p.quantity AS originalQuantity, ii.quantity  
            FROM invoice i, invoiceItem ii, product p 
            WHERE i.id IN (${ids}) AND i.id=ii.invoiceId AND ii.productId=p.id`
        db.all(query, (err, items) => {
            if (err) { reject(err) }
            resolve(items)
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    const newQuanDict = orderItems.reduce((pre, item) => {
        const productId = item.productId
        pre[productId] = calQuanByInvoiceType(pre[productId] || item.originalQuantity, item.quantity, typeStr, true).toString()
        return pre
    }, {})
    Object.keys(newQuanDict).forEach(async productId => {
        const query = `UPDATE product SET quantity="${newQuanDict[productId]}" WHERE id="${productId}"`
        await new Promise((resolve, reject) => {
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        }).catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    })

    // 2. delete sales order
    db.run(`DELETE FROM invoice WHERE id IN (${ids})`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


module.exports = router