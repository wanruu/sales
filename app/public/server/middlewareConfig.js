const express = require("express")
const cors = require('cors')
// require("./db")


// export a function
module.exports = (app) => {
    app.use(express.json());
    app.use(cors());

    // 静态文件托管?
    // app.use(express.static(path.join(__dirname, "public")))
    
    // routes
    require("./routes")(app)
}