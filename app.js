require("dotenv").config();

const express = require("express");
const app = express();
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandlers");
const cookieParser = require("cookie-parser");
const cors = require('cors')

// Connect to Database
connectDB();

// Middleware to parse JSON request body
app.use(cors({
  credentials: true,
  origin: ['http://localhost:5173']
}))

app.use(express.json());
app.use(cookieParser());

// for payment gateway

app.use(express.urlencoded({extended: true}))
app.use(express.json())

const PORT = config.port;
// Root Endpoint
app.get("/", (req, res) => {
  //              !!! Uncomment below lines to test Global Error Handler Middleware !!!

  // const err = createHttpError(404, "Internal Server Error Example");
  // throw err;

  res.json({ message: "Hello from POS Server" });
});

// other end points
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"))
app.use("/api/payment", require("./routes/paymentRoutes"))

//Global Error Handler Middleware

app.use(globalErrorHandler);

//Start the server
app.listen(PORT, () => {
  console.log(`Server is running / listening on port ${PORT}`);
});
