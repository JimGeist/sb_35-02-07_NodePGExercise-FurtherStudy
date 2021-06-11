/** BizTime express application. */
// Server port
const PORT = 5000;

const express = require("express");

const ExpressError = require("./expressError")

const app = express();
app.use(express.json());

const companyRoutes = require("./routes/companies");
app.use("/companies", companyRoutes);

const invoiceRoutes = require("./routes/invoices");
app.use("/invoices", invoiceRoutes);


/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = {
  PORT: PORT,
  app: app
};