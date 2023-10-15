const express = require('express')
const app = express()


// middleware
require("./middlewareConfig")(app)


const start = (port) => {
    app.listen(port, () => {
        console.log(`Listening at port ${port}`)
    })
}


// start(8888);
module.exports = {
    start: start
}

