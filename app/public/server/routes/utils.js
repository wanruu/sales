const db = require("../db")
const Decimal = require('decimal.js');
const crypto = require('crypto')


const INVOICE_TYPE_2_INT = {
    'salesOrder': 0,
    'salesRefund': 1,
    'purchaseOrder': 2,
    'purchaseRefund': 3
}

const INT_2_INVOICE_TYPE = ['salesOrder', 'salesRefund', 'purchaseOrder', 'purchaseRefund']


const formatInsert = (oper, tableName, dictArray, fieldnames) => {
    if (dictArray.length === 0) {
        return { query: '', flatData: [] }
    }

    // fieldname
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


const updateProductQuantityById = (id, quantityChange) => {
    return new Promise((resolve, reject) => {
        db.each(`SELECT * FROM product WHERE id="${id}";`, (err, product) => {
            if (err) { reject(err) }
            const newQuantity = Decimal(product.quantity).plus(quantityChange).toString()
            db.run(`UPDATE product SET quantity="${newQuantity}" WHERE id="${id}"`, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    })
}

const updateProductQuantityByInfo = (material, name, spec, unit, quantityChange) => {
    return new Promise((resolve, reject) => {
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
    }).catch(err => {
        console.error(err)
    })
}


// oper: INSERT / INSERT OR REPLACE / INSERT OR IGNORE
const updatePartner = (oper, name, phone, address) => {
    const query = `${oper} INTO partner (name, phone, address) VALUES ("${name}", "${phone}", "${address}");`
    return new Promise((resolve, reject) => { 
        db.run(query, err => {
            if (err) { reject(err) }
            resolve()
        })
    })
}


const calQuanByInvoiceType = (original, change, invoiceType, reversed) => {
    if (invoiceType === 'salesOrder' || invoiceType === 'purchaseRefund') {
        if (!reversed) {
            return Decimal(original).minus(change)
        }
        return Decimal(original).plus(change)
    }
    if (reversed) {
        return Decimal(original).minus(change)
    }
    return Decimal(original).plus(change)
}


const updateProductByInvoiceItems = async (items, invoiceType) => {
    // 1. find if product is in database
    const productDictArray = await Promise.all(
        items.map(async item => {
            const selectQuery = `SELECT * FROM product WHERE material="${item.material}" AND name="${item.name}" AND spec="${item.spec}";`
            return await new Promise((resolve, reject) => {
                db.all(selectQuery, (err, products) => {
                    const productId = err || products.length === 0 ? crypto.randomUUID() : products[0].id
                    const originalQuan = err || products.length === 0 ? 0 : products[0].quantity
                    resolve({
                        id: productId,
                        material: item.material,
                        name: item.name,
                        spec: item.spec,
                        unit: item.unit,
                        quantity: calQuanByInvoiceType(originalQuan, item.quantity, invoiceType, false).toString(),
                        info: item
                    })
                })
            })
        })
    )
    // 2. update product
    const productFieldnames = ['id', 'material', 'name', 'spec', 'unit', 'quantity']
    const { query, flatData } = formatInsert('INSERT OR REPLACE', 'product', productDictArray, productFieldnames)
    return new Promise((resolve, reject) => { 
        db.run(query, flatData, err => {
            if (err) { reject(err) }
            resolve(productDictArray)
        })
    })
}


const getNextInvoiceId = (date, invoiceType) => {
    const match = (/(\d{4})-(\d{2})-(\d{2})/g).exec(date);
    const prefix = match[1] + match[2] + match[3];
    return new Promise((resolve, reject) => {
        const query = `SELECT MAX(id) id FROM invoice WHERE id LIKE "${prefix}%" AND type=${INVOICE_TYPE_2_INT[invoiceType]};`
        db.each(query, (err, row) => {
            if (err) { reject(err) }
            const invoiceId = row.id === null ?
                prefix + '0001' :
                prefix + (parseInt(row.id.slice(8)) + 1).toString().padStart(4, '0');
            resolve(invoiceId)
        })
    })
}


exports.formatInsert = formatInsert
exports.updateProductQuantityById = updateProductQuantityById
exports.updateProductQuantityByInfo = updateProductQuantityByInfo
exports.updateSalesRefundAmount = updateSalesRefundAmount
exports.updatePartner = updatePartner
exports.updateProductByInvoiceItems = updateProductByInvoiceItems
exports.getNextInvoiceId = getNextInvoiceId
exports.INVOICE_TYPE_2_INT = INVOICE_TYPE_2_INT
exports.INT_2_INVOICE_TYPE = INT_2_INVOICE_TYPE