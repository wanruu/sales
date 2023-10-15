const outBillRouter = require("./outBill")

const routes = (app) => {
    app.use("/outBill", outBillRouter)
}

module.exports = routes