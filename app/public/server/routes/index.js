const salesOrderRouter = require("./salesOrderRoute")
const productRouter = require("./productRoute")
const partnerRouter = require('./partnerRoute')
const salesRefundRouter = require("./salesRefundRoute")

const routes = (app) => {
    app.use("/salesOrder", salesOrderRouter)
    app.use("/product", productRouter)
    app.use("/partner", partnerRouter)
    app.use("/salesRefund", salesRefundRouter)
}

module.exports = routes