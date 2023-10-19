const dbName = 'sales.db'


const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbName)


// change permission
const fs = require('fs')
fs.chmod(dbName, '777', (err) => {
    if (err) {
      console.error('Failed to change database permissions:', err)
    } else {
      console.log('Database permissions changed successfully!')
    }
})


const partner = `CREATE TABLE IF NOT EXISTS partner(
    name TEXT PRIMARY KEY,
    phone TEXT,
    address TEXT
);`

const product = `CREATE TABLE IF NOT EXISTS product(
    id TEXT UNIQUE,
    material TEXT NOT NULL, 
    name TEXT NOT NULL, 
    spec TEXT NOT NULL, 
    unit TEXT NOT NULL,
    quantity TEXT NOT NULL,
    PRIMARY KEY(material, name, spec)
);`

// sales: order & refund
const salesOrderItem = `CREATE TABLE IF NOT EXISTS salesOrderItem(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId TEXT,
    price TEXT NOT NULL,
    discount INTEGER NOT NULL,
    quantity TEXT NOT NULL,
    originalAmount TEXT NOT NULL,
    amount TEXT NOT NULL,
    remark TEXT,
    delivered INTEGER,
    orderId INTEGER,
    FOREIGN KEY(orderId) REFERENCES salesOrder(id) ON DELETE CASCADE,
    FOREIGN KEY(productId) REFERENCES product(id) ON DELETE CASCADE
);`

const salesOrder = `CREATE TABLE IF NOT EXISTS salesOrder(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    prepayment TEXT NOT NULL,
    payment TEXT NOT NULL,
    FOREIGN KEY(partner) REFERENCES partner(name)
);`

const salesRefundItem = `CREATE TABLE IF NOT EXISTS salesRefundItem(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderItemId INTEGER,
    quantity TEXT NOT NULL,
    originalAmount TEXT NOT NULL,
    amount TEXT NOT NULL,
    remark TEXT,
    delivered INTEGER,
    refundId INTEGER,
    FOREIGN KEY(refundId) REFERENCES salesRefund(id) ON DELETE CASCADE,
    FOREIGN KEY(orderItemId) REFERENCES salesOrderItem(id) ON DELETE CASCADE
);`

const salesRefund = `CREATE TABLE IF NOT EXISTS salesRefund(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    payment TEXT NOT NULL,
    FOREIGN KEY(partner) REFERENCES partner(name)
);`


// purchase 
const purchaseOrderItem = `CREATE TABLE IF NOT EXISTS purchaseOrderItem(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId TEXT,
    price TEXT NOT NULL,
    discount INTEGER NOT NULL,
    quantity TEXT NOT NULL,
    weight TEXT NOT NULL,
    originalAmount TEXT NOT NULL,
    amount TEXT NOT NULL,
    remark TEXT,
    delivered INTEGER,
    orderId INTEGER,
    FOREIGN KEY(orderId) REFERENCES purchaseOrder(id) ON DELETE CASCADE,
    FOREIGN KEY(productId) REFERENCES product(id) ON DELETE CASCADE
);`

const purchaseOrder = `CREATE TABLE IF NOT EXISTS purchaseOrder(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    payment TEXT NOT NULL,
    FOREIGN KEY(partner) REFERENCES partner(name)
);`

const purchaseRefundItem = `CREATE TABLE IF NOT EXISTS purchaseRefundItem(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderItemId INTEGER,
    quantity TEXT NOT NULL,
    weight TEXT NOT NULL,
    originalAmount TEXT NOT NULL,
    amount TEXT NOT NULL,
    remark TEXT,
    delivered INTEGER,
    refundId INTEGER,
    FOREIGN KEY(refundId) REFERENCES purchaseRefund(id) ON DELETE CASCADE,
    FOREIGN KEY(orderItemId) REFERENCES purchaseOrder(id) ON DELETE CASCADE
);`

const purchaseRefund = `CREATE TABLE IF NOT EXISTS purchaseRefund(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    payment TEXT NOT NULL,
    FOREIGN KEY(partner) REFERENCES partner(name)
);`


const creations = [ 
    partner, product, 
    salesOrderItem, salesOrder, 
    salesRefundItem, salesRefund,
    purchaseOrderItem, purchaseOrder,
    purchaseRefundItem, purchaseRefund
]

// create tables
db.serialize(() => {
    console.log('Init database')
    db.run('PRAGMA foreign_keys=ON')  // auto delete product when deleting invoice
    
    for (const creation of creations) {
        db.run(creation, (err) => {
            if (err) console.log(err)
        })
    }
})


module.exports = db