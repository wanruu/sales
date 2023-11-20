const express = require('express')
const app = express()
const os = require('os')


// middleware
require('./middlewareConfig')(app)


const start = (port) => {
    app.listen(port, () => {
        console.log(`Listening at port ${port}`)
    })
}


// start(8888)
module.exports = {
    start: start
}

if (process.argv.length >= 3) {
    start(process.argv[2])
}
