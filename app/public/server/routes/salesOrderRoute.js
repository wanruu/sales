const express = require("express")
const router = express.Router()
const crypto = require('crypto')
const Decimal = require('decimal.js');

const db = require("../db")
const { formatInsert, updateProductQuantityByInfo, updateSalesRefundAmount, updateProductQuantityById,
    updatePartner, updateProductByInvoiceItems, getNextInvoiceId,
    INT_2_INVOICE_TYPE, INVOICE_TYPE_2_INT 
} = require('./utils.js');


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

    // 2. insert/update products
    var productDictArray = []
    if (items.length !== 0) {
        productDictArray = await updateProductByInvoiceItems(items, 'salesOrder').catch(err => {
            console.error(err)
            res.status(500).send(err)
        })
    }
    
    // 3. insert salesOrder
    const orderId = await getNextInvoiceId(date, 'salesOrder').catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    const orderInsert = `INSERT INTO invoice (id, type, partner, date, amount, prepayment, payment) VALUES 
    ("${orderId}", ${INVOICE_TYPE_2_INT.salesOrder}, "${partner}", "${date}", "${amount}", "${prepayment}", "${payment}")`
    await new Promise((resolve, reject) => {
        db.run(orderInsert, err => {
            if (err) { reject(err) }
            resolve()
        })
    }).catch(err => {
        console.error(err)
        res.status(500).send(err)
    })
    
    // 4. insert salesOrderItem
    if (productDictArray.length > 0) {
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

// router.put('/id/:id', async (req, res) => {
//     const id = req.params.id  // str
//     if (id === undefined) {
//         res.status(400).send('Insufficient data')
//         return
//     }

//     // 1. update partner
//     const salesOrderChange = req.body.salesOrderChange  // {partner, date, amount, prepayment, payment}
//     if (salesOrderChange['partner'] !== undefined) {
//         const query = `INSERT OR IGNORE INTO partner (name) VALUES ("${salesOrderChange.partner}");`
//         await new Promise((resolve, reject) => {
//             db.run(query, err => {
//                 if (err) { reject(err) }
//                 resolve()
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//         }).catch(err => {
//             console.error(err)
//             res.status(500).send()
//         })
//     }

//     // 2. update salesOrder
//     if (salesOrderChange !== undefined) {
//         const updates = []
//         for (const key in salesOrderChange) {
//             updates.push(`${key}="${salesOrderChange[key]}"`)
//         }
//         if (updates.length > 0) {
//             const query = `UPDATE salesOrder SET ` + updates.join(', ') + ` WHERE id=${id}`
//             await new Promise((resolve, reject) => {
//                 db.run(query, err => {
//                     if (err) {
//                         reject(err)
//                     }
//                     resolve()
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//         }
//     }
    
//     // 3. update salesOrderItem, product
//     const deleteOrderItems = req.body.deleteOrderItems  // [{id,productId,quantity}]
//     if (deleteOrderItems !== undefined && deleteOrderItems.length > 0) {
//         const idStr = deleteOrderItems.map(item => item.id.toString()).join(', ')
//         await new Promise((resolve, reject) => {
//             db.run(`DELETE FROM salesOrderItem WHERE id IN (${idStr});`, err => {
//                 if (err) { reject(err) }
//                 resolve()
//             })
//         }).catch(err => {
//             console.error(err)
//             res.status(500).send()
//             return
//         })
//     }
//     const newOrderItems = req.body.newOrderItems
//     // [{material,name,spec,unit,quantity, price,discount,originalAmount,amount,remark,}]
//     if (newOrderItems !== undefined && newOrderItems.length > 0) {
//         for (const item of newOrderItems) {
//             // product
//             var newProductId = crypto.randomUUID()
//             const productInsert = `INSERT OR IGNORE INTO product (id, material, name, spec, unit, quantity) 
//             VALUES ("${newProductId}", "${item.material}", "${item.name}", "${item.spec}", "${item.unit}", "-${item.quantity}");`
//             const ret = await new Promise((resolve, reject) => {
//                 db.run(productInsert, function(err) {
//                     if (err) { reject(err) }
//                     resolve(this.changes === 1)
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//             if (ret === false) {
//                 newProductId = await new Promise((resolve, reject) => {
//                     db.each(`SELECT id FROM product WHERE material="${item.material}" AND name="${item.name}" AND spec="${item.spec}"`, function(err, product) {
//                         if (err) { reject(err) }
//                         resolve(product.id)
//                     })
//                 }).catch(err => {
//                     console.error(err)
//                     res.status(500).send()
//                     return
//                 })
//             }
//             // salesOrderItem
//             const orderItemDictArray = [{
//                 productId: newProductId,
//                 price: item.price,
//                 discount: item.discount,
//                 quantity: item.quantity,
//                 originalAmount: item.originalAmount,
//                 amount: item.amount,
//                 remark: item.remark,
//                 delivered: 0,
//                 orderId: parseInt(id)
//             }]
//             var { query, flatData } = formatInsert('INSERT', 'salesOrderItem', orderItemDictArray, [])
//             await new Promise((resolve, reject) => { 
//                 db.run(query, flatData, err => {
//                     if (err) { 
//                         reject(err)
//                     }
//                     resolve()
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//         }
//     }
//     const updatedOrderItems = req.body.updatedOrderItems  
//     // [{id,productId,material,name,spec,unit,price,discount,originalQuantity,quantity,originalAmount,amount,remark}]
//     if (updatedOrderItems !== undefined && updatedOrderItems.length > 0) {
//         for (const item of updatedOrderItems) {
//             var productId;
            
//             // 是否创建新product
//             const newProductId = crypto.randomUUID()
//             const ifCreateProduct = await new Promise((resolve, reject) => {
//                 const query = `INSERT OR IGNORE INTO product (id,material,name,spec,unit,quantity) 
//                 VALUES ("${newProductId}", "${item.material}", "${item.name}", "${item.spec}", "${item.unit}", "0")`
//                 db.run(query, function(err) {
//                     if (err) { reject(err) }
//                     resolve(this.changes)
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//             if (ifCreateProduct === 1) {
//                 // 创建了新product
//                 productId = newProductId
//             } else {
//                 // 没有创建新product
//                 const product = await new Promise((resolve, reject) => {
//                     db.each(`SELECT * FROM product WHERE material="${item.material}" AND name="${item.name}" AND spec="${item.spec}"`, (err, product) => {
//                         if (err) { reject(err) }
//                         resolve(product)
//                     })
//                 }).catch(err => {
//                     console.error(err)
//                     res.status(500).send()
//                     return
//                 })
//                 // update unit
//                 if (product.unit !== item.unit) {
//                     await new Promise((resolve, reject) => {
//                         db.run(`UPDATE product SET unit="${item.unit}" WHERE id="${product.id}"`, err => {
//                             if (err) { reject(err) }
//                             resolve()
//                         })
//                     }).catch(err => {
//                         console.error(err)
//                         res.status(500).send()
//                         return
//                     })
//                 }
//                 productId = product.id
//             }
//             const query = `UPDATE salesOrderItem 
//                 SET productId="${productId}", price="${item.price}", discount=${item.discount}, quantity="${item.quantity}", 
//                 originalAmount="${item.originalAmount}", amount="${item.amount}", remark="${item.remark}" 
//                 WHERE id=${id}`
//             await new Promise((resolve, reject) => {
//                 db.run(query, err => {
//                     if (err) { reject(err) }
//                     resolve()
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//             // update product
//             if (item.productId === productId) {
//                 updateProductQuantityById(productId, Decimal(item.originalQuantity).minus(item.quantity).toString())
//             } else {
//                 updateProductQuantityById(item.productId, item.originalQuantity)
//                 updateProductQuantityById(productId, "-" + item.quantity)
//             }
//         }
//     }
//     // 4. update salesRefundItem, salesRefund amount
//     const updatedSalesRefundItems = req.body.updatedSalesRefundItems  // [{refundId,id,originalAmount,amount}]
//     if (updatedSalesRefundItems !== undefined && updatedSalesRefundItems.length > 0) {
//         // salesRefundItem
//         for (const refundItem of updatedSalesRefundItems) {
//             const query = `UPDATE salesRefundItem 
//             SET originalAmount="${originalAmount}", amount="${amount}" 
//             WHERE id=${refundItem.id}`
//             await new Promise((resolve, reject) => {
//                 db.run(query, err => {
//                     if (err) { reject(err) }
//                     resolve()
//                 })
//             }).catch(err => {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             })
//         }
//         // salesRefund
//         const refundIds = updatedSalesRefundItems.reduce((previous, current) => {
//             previous.add(current.refundId)
//             return previous
//         }, Set())
//         for (const refundId of refundIds) {
//             updateSalesRefundAmount(refundId)
//         }
//     }
//     res.send()
// })

router.get('/', (req, res) => {
    const query = `SELECT * FROM invoice WHERE type=${INVOICE_TYPE_2_INT.salesOrder}`
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
    db.all(`SELECT * FROM invoice WHERE type=${INVOICE_TYPE_2_INT.salesOrder}`, (err, orders) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        
        const query = `SELECT i.invoiceId, i.id AS invoiceItemId, p.id AS productId, p.material, p.name, p.spec, p.unit, price, i.quantity, i.amount, discount, originalAmount, remark, delivered 
        FROM invoice o, invoiceItem i, product p 
        WHERE o.id=i.invoiceId AND p.id=productId AND relatedId IS NULL AND o.type=${INVOICE_TYPE_2_INT.salesOrder}`
        db.all(query, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            for (const item of items) {
                const order = orders.find(order => order.id === item.invoiceId)
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
    const id = req.params.id  // str
    if (id === undefined) {
        res.status(400).send('Insufficient data')
        return
    }

    const orderSelect = `SELECT * 
    FROM invoice i, partner p 
    WHERE id="${id}" AND i.partner=p.name AND type=${INVOICE_TYPE_2_INT.salesOrder};`
    db.all(orderSelect, (err, orders) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        if (orders.length === 0) {
            res.status(404).send('No salesOrder')
            return
        }
        
        const itemSelect = `SELECT i.id AS id, productId, price, discount, i.quantity AS quantity, originalAmount, amount, remark, delivered, invoiceId, 
        material, name, spec, unit, p.quantity AS remainingQuantity 
        FROM invoiceItem AS i, product AS p 
        WHERE i.invoiceId=${id} AND p.id=i.productId;`
        db.all(itemSelect, (err, items) => {
            if (err) {
                console.error(err)
                res.status(500).send(err)
                return
            }
            res.send(Object.assign(orders[0], { items: items }))
        })
    })
})

// router.delete('/id/:id', async (req, res) => {
//     const id = req.params.id  // str
//     if (id === undefined) {
//         res.status(400).send('Insufficient data')
//         return
//     }
//     // 1. get product
//     const productSelect = `SELECT productId, i.id AS itemId, p.quantity AS originalQuantity, i.quantity changeQuantity 
//     FROM salesOrderItem AS i, product AS p 
//     WHERE i.orderId=${id} AND i.productId=p.id;`
//     const products = await new Promise((resolve, reject) => { 
//         db.all(productSelect, (err, products) => {
//             if (err) {
//                 reject(err)
//             } 
//             resolve(products)
//         })
//     }).catch(err => {
//         console.error(err)
//         res.status(500).send()
//     })
//     // 2. get salesRefund
//     const refundSelect = `SELECT ri.refundId AS refundId, oi.orderId AS orderId, ri.amount AS amount 
//     FROM salesOrderItem AS oi, salesRefundItem AS ri 
//     WHERE oi.id=ri.orderItemId AND oi.orderId=${id};`
//     const refunds = await new Promise((resolve, reject) => { 
//         db.all(refundSelect, (err, refunds) => {
//             if (err) {
//                 reject(err)
//             }
//             resolve(refunds)
//         })
//     }).catch(err => {
//         console.error(err)
//         res.status(500).send()
//     })

//     // ------- START TO UPDATE -------
//     db.serialize(() => {
//         // update product quantity
//         products.forEach(row => {
//             const newQuantity = Decimal(row.changeQuantity).plus(row.originalQuantity).toString()
//             const updateQuantity = `UPDATE product SET quantity="${newQuantity}" WHERE id="${row.productId}";`
//             db.run(updateQuantity)
//         })
//         // delete salesOrder
//         db.run(`DELETE FROM salesOrder WHERE id=${id};`, err => {
//             if (err) {
//                 console.error(err)
//                 res.status(500).send()
//                 return
//             }
//             // update salesRefund amount (refundId, orderId, amount)
//             const init = refunds.reduce((previous, current) => {
//                 previous[current.refundId] = { refundId: current.refundId, amount: Decimal(0) }
//                 return previous
//             }, {})
//             const updateRefundOrder = refunds.filter(refund => `${refund.orderId}` !== `${id}`).reduce((previous, current) => {
//                 const refundId = current.refundId
//                 previous[refundId].amount = previous[refundId].amount.plus(Decimal(current.amount))
//                 return previous
//             }, init)
//             db.serialize(() => {
//                 for (let refundId in updateRefundOrder) {
//                     db.run(`UPDATE salesRefund SET amount="${updateRefundOrder[refundId].amount.toString()}" WHERE id=${refundId}`, err => {
//                         if (err) {
//                             console.error(err)
//                             res.status(500).send()
//                             return
//                         }
//                     })
//                 }
//                 res.send()
//             })
//         })
//     })
// })

module.exports = router