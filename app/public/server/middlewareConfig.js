const express = require('express')
const cors = require('cors')
const path = require('path')

// export a function
module.exports = (app) => {
    app.use(express.json())
    app.use(cors())
    
    // 静态文件托管
    app.use(express.static(path.join(__dirname, 'files')))
    
    // routes
    require('./routes')(app)
}