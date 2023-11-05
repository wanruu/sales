const express = require("express")
const router = express.Router()
const Decimal = require('decimal.js');
const crypto = require('crypto')


const db = require("../db")

const unitCoeffDict = {
    '千件': new Decimal(1000),
    '只': new Decimal(1),
    '包': new Decimal(1),
    '斤': new Decimal(1),
    '套': new Decimal(1),
}

router.get('/', async (req, res) => {
    const t1 = `SELECT p.id, COUNT(*) AS invoiceNum 
    FROM product AS p, invoiceItem AS ii 
    WHERE p.id=ii.productId GROUP BY p.id`
    const query = `SELECT p.id, material, name, spec, unit, quantity, invoiceNum
    FROM product AS p LEFT JOIN (${t1}) AS t ON p.id=t.id`
    db.all(query, (err, products) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.send(products)
    })
})



router.get('/unit/:material/:name/:spec', (req, res) => {
    const query = `SELECT unit FROM product 
    WHERE material="${req.params.material}" AND name="${req.params.name}" AND spec="${req.params.spec}"`
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        const unit = rows.length === 0 ? undefined : rows[0].unit
        res.send({ unit: unit })
    })
})


router.delete('/id/:id', (req, res) => {
    db.run(`DELETE FROM product WHERE id="${req.params.id}"`, err => {
        if (err) {
            console.error(err)
            res.status(500).send(err)
            return
        }
        res.end()
    })
})


router.put('/id/:id', async (req, res) => {
    const updates = ['material', 'name', 'spec', 'unit', 'quantity'].map(key => 
        `${key}="${req.body[key]}"`
    ).join(', ')
    const query = `UPDATE product SET ${updates} WHERE id="${req.params.id}"`
    
    const data = await new Promise((resolve, reject) => {
        db.run(query, err => {
            if (err && err.errno === 19) { 
                resolve({ changes: 0, prompt: '产品重复' } )
            }
            if (err) {
                reject(err)
            }
            resolve({ changes: 1 })
        })
    })
    
    if (req.body.unitRatio !== '1') {
        // update invoice items: amount & originalAmount
        const selectItems = `SELECT invoiceId, ii.id AS invoiceItemId, ii.price, ii.quantity, p.unit, ii.discount, i.amount
        FROM product AS p, invoiceItem AS ii, invoice AS i
        WHERE ii.productId=p.id AND p.id="${req.params.id}" AND ii.invoiceId=i.id`
        const items = await new Promise((resolve, reject) => {
            db.all(selectItems, (err, items) => {
                if (err) { reject(err) }
                resolve(items)
            })
        })
        const invoiceItemsInfo = await Promise.all(items.map(item => {
            const originalAmount = Decimal(item.quantity).times(item.price).times(unitCoeffDict[item.unit]).toFixed(2, Decimal.ROUND_HALF_UP)
            const amount = Decimal(originalAmount).times(item.discount).dividedBy(100).toFixed(2, Decimal.ROUND_HALF_UP)
            const amountChange = Decimal(amount).sub(item.amount).toString()
            return new Promise((resolve, reject) => {
                db.run(`UPDATE invoiceItem SET originalAmount="${originalAmount}", amount="${amount}" WHERE id="${item.invoiceItemId}"`, err => {
                    if (err) { reject(err) }
                    resolve({ invoiceId: item.invoiceId, amount: item.amount, amountChange: amountChange })
                })
            })
        }))
        // update invoice: amount
        const invoiceInfo = invoiceItemsInfo.reduce((pre, cur) => {
            if (pre[cur.invoiceId] === undefined) {
                pre[cur.invoiceId] = Decimal(cur.amount).plus(cur.amountChange)
            } else {
                pre[cur.invoiceId] = pre[cur.invoiceId].plus(cur.amountChange)
            }
            return pre
        }, {})
        for (const invoiceId in invoiceInfo) {
            const query = `UPDATE invoice SET amount="${invoiceInfo[invoiceId].toFixed(2, Decimal.ROUND_HALF_UP)}" WHERE id="${invoiceId}"`
            await new Promise((resolve, reject) => {
                db.run(query, err => {
                    if (err) { reject(err) }
                    resolve()
                })
            })
        }
    }

    res.send(data)
})


router.post('/', (req, res) => {
    const query = `INSERT INTO product (id, material, name, spec, quantity, unit) 
    VALUES ("${crypto.randomUUID()}", "${req.body.material}", "${req.body.name}", "${req.body.spec}", "${req.body.quantity}", "${req.body.unit}")`
    db.run(query, err => {
        if (err && err.errno === 19) { 
            console.error(err)
            res.send({ changes: 0, prompt: '产品重复' })
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


module.exports = router