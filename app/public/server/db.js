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
    address TEXT,
    folder TEXT
);`

const product = `CREATE TABLE IF NOT EXISTS product(
    id TEXT UNIQUE,
    material TEXT NOT NULL, 
    name TEXT NOT NULL, 
    spec TEXT NOT NULL, 
    unit TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    PRIMARY KEY(material, name, spec)
);`


const invoiceItem = `CREATE TABLE IF NOT EXISTS invoiceItem(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId TEXT NOT NULL,
    price DECIMAL NOT NULL,
    discount INTEGER NOT NULL,
    quantity DECIMAL NOT NULL,
    weight DECIMAL,
    originalAmount MONEY NOT NULL,
    amount MONEY NOT NULL,
    remark TEXT,
    delivered INTEGER,
    invoiceId TEXT NOT NULL,
    FOREIGN KEY(invoiceId) REFERENCES invoice(id) ON DELETE CASCADE,
    FOREIGN KEY(productId) REFERENCES product(id) ON DELETE CASCADE
);`

const invoice = `CREATE TABLE IF NOT EXISTS invoice(
    id TEXT PRIMARY KEY,
    type INTEGER NOT NULL,
    partner TEXT NOT NULL,
    date TEXT NOT NULL,
    amount MONEY NOT NULL,
    prepayment MONEY NOT NULL,
    payment MONEY NOT NULL,
    FOREIGN KEY(partner) REFERENCES partner(name) ON DELETE CASCADE
);`

const invoiceRelation = `CREATE TABLE IF NOT EXISTS invoiceRelation(
    orderId TEXT NOT NULL,
    refundId TEXT NOT NULL,
    FOREIGN KEY(orderId) REFERENCES invoice(id) ON DELETE CASCADE,
    FOREIGN KEY(refundId) REFERENCES invoice(id) ON DELETE CASCADE
);`


const creations = [ 
    partner, product, invoice, invoiceItem, invoiceRelation
]

// create tables
db.serialize(() => {
    console.log('Init database')
    db.run('PRAGMA foreign_keys=ON')  // auto delete product when deleting invoice
    
    for (const creation of creations) {
        db.run(creation, (err) => {
            if (err) {
                console.error(err)
            }
        })
    }
})


module.exports = db