const salesOrderRouter = require("./salesOrderRoute")
const productRouter = require("./productRoute")


const routes = (app) => {
    app.use("/salesOrder", salesOrderRouter)
    app.use("/product", productRouter)
}

module.exports = routes