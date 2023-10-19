const salesOrderRouter = require("./salesOrderRoute")
const productRouter = require("./productRoute")
const partnerRouter = require('./partnerRoute')

const routes = (app) => {
    app.use("/salesOrder", salesOrderRouter)
    app.use("/product", productRouter)
    app.use("/partner", partnerRouter)
}

module.exports = routes