const salesOrderRouter = require("./salesOrder")

const routes = (app) => {
    app.use("/salesOrder", salesOrderRouter)
}

module.exports = routes