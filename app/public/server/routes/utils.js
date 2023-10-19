const db = require("../db")
const Decimal = require('decimal.js');
const crypto = require('crypto')


const formatInsert = (oper, tableName, dictArray, fieldnames) => {
    if (dictArray.length === 0) {
        return { query: '', flatData: [] }
    }

    // fieldname
    // var fieldnames = fieldnames
    if (fieldnames.length === 0) {
        fieldnames = Object.keys(dictArray[0])
    }
    if (fieldnames.length === 0) {
        return { query: '', flatData: [] }
    }

    // main
    const itemHolder = fieldnames.map(() => '?').join(', ')
    const placeholders = dictArray.map(() => `(${itemHolder})`).join(', ')
    const query = `${oper} INTO ${tableName} (${fieldnames.join(', ')}) VALUES ${placeholders};`
    const flatData = [];
    dictArray.forEach(dict => {
        fieldnames.forEach(key => {
            flatData.push(dict[key])
        })
    })
    return { query: query, flatData: flatData }
}


const updateProductQuantityById = async (id, quantityChange) => {
    return await new Promise((resolve, reject) => {
        db.each(`SELECT * FROM product WHERE id="${id}";`, (err, product) => {
            if (err) { reject(err) }
            const newQuantity = Decimal(product.quantity).plus(quantityChange).toString()
            db.run(`UPDATE product SET quantity="${newQuantity}" WHERE id="${id}"`, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    }).then(err => {
        console.error(err)
    })
}

const updateProductQuantityByInfo = async (material, name, spec, unit, quantityChange) => {
    return await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM product WHERE material="${material}" AND name="${name}" AND spec="${spec}";`, (err, products) => {
            if (err) { reject(err) }
            var query;
            if (products.length === 0) {
                query = `INSERT INTO product (id, material, name, spec, unit, quantity) 
                VALUES ("${crypto.randomUUID()}", "${material}", "${name}", "${spec}", "${unit}", "${quantityChange}")`
            } else {
                const newQuantity = Decimal(products[0].quantity).plus(quantityChange).toString()
                query = `UPDATE product SET quantity="${newQuantity}" WHERE id="${products[0].id}"`
            }
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    }).then(err => {
        console.error(err)
    })
}

const updateSalesRefundAmount = async (refundId) => {
    const selectAllItems = `SELECT i.amount 
    FROM salesRefund AS r, salesRefundItem AS i 
    WHERE r.id=${refundId} AND r.id=i.refundId`
    return await new Promise((resolve, reject) => {
        db.all(selectAllItems, (err, items) => {
            if (err) { reject(err) }
            const amount = items.reduce((previous, current) => {
                return previous.plus(current.amount)
            }, Decimal(0)).toString()
            resolve(amount)
        })
    }).then(err => {
        console.error(err)
    })
}

exports.formatInsert = formatInsert
exports.updateProductQuantityById = updateProductQuantityById
exports.updateProductQuantityByInfo = updateProductQuantityByInfo
exports.updateSalesRefundAmount = updateSalesRefundAmount