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



const createInvoices = 'CREATE table IF NOT EXISTS invoices' +
    '(id TEXT NOT NULL, customer TEXT NOT NULL, create_date TEXT NOT NULL, delete_date TEXT, is_paid INTEGER, is_invoiced INTEGER, ' +
    'PRIMARY KEY(id))'
const createProducts = 'CREATE table IF NOT EXISTS products' +
    '(invoice_id TEXT NOT NULL, material TEXT NOT NULL, name TEXT NOT NULL, spec TEXT NOT NULL, ' +
    'unit_price REAL NOT NULL, quantity REAL NOT NULL, remark TEXT, ' +
    'FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE)'


// create tables
db.serialize(() => {
    console.log('Init database')
    db.run('PRAGMA foreign_keys=ON')  // auto delete product when deleting invoice
    
    db.run(createInvoices, (err) => {
        if (err) console.log(err)
    })
    db.run(createProducts, (err) => {
        if (err) console.log(err)
    })
})


module.exports = db