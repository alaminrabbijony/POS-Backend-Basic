const { base } = require("../models/paymentModel");

require("dotenv").config();

const config = Object.freeze({
  port: process.env.PORT || 3000,
  databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017/myapp",
  nodeENV: process.env.NODE_ENV || "development",
  assessTokenSecret: process.env.JWT_SCERET,
  baseURL: process.env.BASE_URL || "http://localhost:8000",
  frontendBaseURL: process.env.FRONTEND_BASE_URL || "http://localhost:5173",

  // SSLCommerz
  sslcommerz: {
    storeId: process.env.SSL_STORE_ID,
    storePassword: process.env.SSL_STORE_PASSWORD,
    sandbox: process.env.SSL_SANDBOX === "true",
    sessionUrl: "https://sandbox.sslcommerz.com/gwprocess/v3/api.php",
    validationUrl: `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
`
  },
});
module.exports = config;
