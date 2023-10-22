const salesOrderRouter = require("./salesOrderRoute")
const productRouter = require("./productRoute")
const partnerRouter = require('./partnerRoute')
const salesRefundRouter = require("./salesRefundRoute")
const promptRouter = require("./promptRoute")

const routes = (app) => {
    app.use("/salesOrder", salesOrderRouter)
    app.use("/product", productRouter)
    app.use("/partner", partnerRouter)
    app.use("/salesRefund", salesRefundRouter)
    app.use("/prompt", promptRouter)
}

module.exports = routes