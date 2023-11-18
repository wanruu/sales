const db = require('../db')
const Decimal = require('decimal.js')
const crypto = require('crypto')

// ----- constant -----
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
    const flatData = []
    dictArray.forEach(dict => {
        fieldnames.forEach(key => {
            flatData.push(dict[key])
        })
    })
    return { query: query, flatData: flatData }
}


const updateProductQuantityByInfo = (material, name, spec, unit, quantityChange) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM product WHERE material="${material}" AND name="${name}" AND spec="${spec}";`, (err, products) => {
            if (err) { reject(err) }
            var query
            if (products.length === 0) {
                query = `INSERT INTO product (id, material, name, spec, unit, quantity) 
                VALUES ("${crypto.randomUUID()}", "${material}", "${name}", "${spec}", "${unit}", "${quantityChange}")`
            } else {
                const newQuantity = Decimal(products[0].quantity).plus(quantityChange).toString()
                query = `UPDATE product SET unit="${unit}", quantity="${newQuantity}" WHERE id="${products[0].id}"`
            }
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    })
}


/*
    Insert partner. (Used when new partner was submitted)
    params oper: INSERT / INSERT OR REPLACE / INSERT OR IGNORE
 */
const updatePartner = (oper, name, phone, address, folder) => {
    const query = `${oper} INTO partner (name, phone, address, folder) VALUES ("${name}", "${phone}", "${address}", "${folder}");`
    return new Promise((resolve, reject) => { 
        db.run(query, err => {
            if (err) { reject(err) }
            resolve()
        })
    })
}

/*
    Calculate new quantity by invoice type.
 */
const calQuanByInvoiceType = (original, change, invoiceType, reversed) => {
    if (getQuantitySign(invoiceType, reversed) === '+') {
        return Decimal(original).plus(change)
    }
    return Decimal(original).minus(change)
}

const getQuantitySign = (invoiceType, ifDelete) => {
    if (invoiceType === 'salesOrder' || invoiceType === 'purchaseRefund') {
        if (!ifDelete) return '-'
        return '+'
    }
    if (ifDelete) return '-'
    return '+'
}

/*
    Insert product if not existing when new order is created.
    return: product dictionary array
 */
const updateProductByInvoiceItems = async (items, invoiceType) => {
    // 1. find if product is in database
    const productDictArray = await Promise.all(
        items.map(item => {
            const selectQuery = `SELECT * FROM product WHERE material="${item.material}" AND name="${item.name}" AND spec="${item.spec}";`
            return new Promise((resolve, reject) => {
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
                        info: item,
                        isNew: err || products.length === 0
                    })
                })
            })
        })
    )
    // 2. insert product (not existing)
    const newProducts = productDictArray.filter(p => p.isNew)
    if (newProducts.length > 0) {
        const productFieldnames = ['id', 'material', 'name', 'spec', 'unit', 'quantity']
        const { query, flatData } = formatInsert('INSERT', 'product', newProducts, productFieldnames)
        await new Promise((resolve, reject) => { 
            db.run(query, flatData, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    }
    // 3. update product (existing)
    const oldProducts = productDictArray.filter(p => !p.isNew)
    await Promise.all(oldProducts.map(p => {
        return new Promise((resolve, reject) => {
            const query = `UPDATE product 
            SET material="${p.material}", name="${p.name}", spec="${p.spec}", unit="${p.unit}", quantity="${p.quantity}" WHERE id="${p.id}"`
            db.run(query, err => {
                if (err) { reject(err) }
                resolve()
            })
        })
    }))
    return productDictArray
}


const getNextInvoiceId = (date, invoicePrefix) => {
    const match = (/(\d{4})-(\d{2})-(\d{2})/g).exec(date)
    const prefix = invoicePrefix + match[1] + match[2] + match[3]
    return new Promise((resolve, reject) => {
        const query = `SELECT MAX(id) id FROM invoice WHERE id LIKE "${prefix}%";`
        db.each(query, (err, row) => {
            if (err) { reject(err) }
            const invoiceId = row.id === null ?
                prefix + '0001' :
                prefix + (parseInt(row.id.slice(prefix.length)) + 1).toString().padStart(4, '0')
            resolve(invoiceId)
        })
    })
}


const isDateValid = (date) => {
    return (/(\d{4})-(\d{2})-(\d{2})/g).exec(date) !== null
}


exports.isDateValid = isDateValid
exports.formatInsert = formatInsert
exports.getQuantitySign = getQuantitySign
exports.getNextInvoiceId = getNextInvoiceId
// exports.calQuanByInvoiceType = calQuanByInvoiceType

exports.updateProductQuantityByInfo = updateProductQuantityByInfo
exports.updatePartner = updatePartner
exports.updateProductByInvoiceItems = updateProductByInvoiceItems


exports.INVOICE_TYPE_2_INT = INVOICE_TYPE_2_INT
exports.INT_2_INVOICE_TYPE = INT_2_INVOICE_TYPE