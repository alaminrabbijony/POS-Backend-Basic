const config = require("../config/config");
const Payment = require("../models/paymentModel");
const createHttpError = require("http-errors");
const axios = require("axios");
const Order = require("../models/orderModel");
const qs = require("qs");
const mongoose = require("mongoose");
const SSLCommerzPayment = require("sslcommerz-lts");
const paymentProcessor = require("./processor/paymentProcessor");
const tableModel = require("../models/tableModel");

const sslcz = new SSLCommerzPayment(
  config.sslcommerz.storeId,
  config.sslcommerz.storePassword,
  false //true for live, false for sandbox
);

/*
=====================================================
INIT PAYMENT (CREATE SSL SESSION)
=====================================================
- Called when user clicks "Pay"
- Creates a Payment record (PENDING)
- Updates Order → PAYMENT_PENDING
- Returns GatewayPageURL to frontend
- DOES NOT mark payment as success
=====================================================
*/
const initPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    //validate orderId

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createHttpError(400, "INVALID ORDER ID FOR PAYMENT INIT"));
    }

    //FETCH ORDER

    const order = await Order.findById(orderId);

    if (!order)
      return next(createHttpError(404, "ORDER NOT FOUND FOR PAYMENT INIT"));

    // PREVENT DOUBLE PAYMENT
    if (order.orderStatus === "PAYMENT_COMPLETED") {
      return next(createHttpError(400, "ORDER ALREADY PAID: PAYMENT INIT"));
    }

    const amount = order.bills.totalWithTax;

    // CREATE PAYMENT RECORD
    const payment = await Payment.create({
      orderId: order._id,
      amount,
      provider: "SSLCOMMERZ",
      status: "PENDING",
    });
    // LINK PAYMENT TO ORDER and UPDATE STATUS
    order.orderStatus = "PAYMENT_PENDING";
    order.payment = payment._id;
    await order.save();

    // prepare the SSLCommerz payment session request payload for launch
    const payload = {
      store_id: config.sslcommerz.storeId,
      store_passWd: config.sslcommerz.storePassword,

      total_amount: amount,
      currency: "BDT",

      // Payment ID = tran_id

      tran_id: payment._id.toString(),

      success_url: `${config.baseURL}/api/payment/success`,
      fail_url: `${config.baseURL}/api/payment/failure`,
      cancel_url: `${config.baseURL}/api/payment/cancel`,
      ipn_url: `${config.baseURL}/api/payment/ipn`,

      cus_name: order.customerDetails.name,
      cus_phone: order.customerDetails.phone,
      cus_email: "test@example.com",
      cus_country: "Bangladesh",

      shipping_method: "NO",
      product_name: "POS Order",
      product_category: "Food",
      product_profile: "general",
    };

    //CALL SSLCommerz to create payment session (USING RAW NOT SSLCOMERZ INIT)

    /* Using Custom Axios Post
    const apiResponse = await axios.post(
      config.sslcommerz.sessionUrl,
      qs.stringify(payload),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000
      }
    ); // this has some prblm 
*/

    // USING SSLCommerz PACKAGE

    const apiResponse = await sslcz.init(payload);

    // send redirect URL to frontend
    res.status(200).json({
      success: true,
      paymentId: payment._id,
      redirectUrl: apiResponse.GatewayPageURL,
    });
  } catch (error) {
    return next(error);
  }
};

const paymentSuccess = async (req, res, next) => {
  console.log("SSLCommerz SUCCESS BODY:", req.body);
  //frontend will call validate endpoint
  // res.redirect(`${config.frontendBaseURL}/processing?status=success`);

  /*Backend Validates */
  return paymentProcessor({ req, res, finalStatus: "SUCCESS" });
};
const paymentFailure = async (req, res) => {
  console.log("SSLCommerz FAILURE BODY:", req.body);
  //res.redirect(`${config.frontendBaseURL}/processing?status=failure`);
  /*Backend Validates */
  return paymentProcessor({ req, res, finalStatus: "FAILED" });
};

const paymentCancel = async (req, res) => {
  console.log("SSLCommerz CANCEL BODY:", req.body);
  // res.redirect(`${config.frontendBaseURL}/processing?status=cancel`);

  /*Backend Validates */
  return paymentProcessor({ req, res, finalStatus: "REFUNDED" });
};

/*
=====================================================
 VALIDATE PAYMENT 
=====================================================
- Called by frontend AFTER redirect
- Also reused by IPN
- Calls SSLCommerz Validation API
- Marks payment SUCCESS / FAILED
=====================================================
*/

const cashPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createHttpError(400, "Missing or Invalid Order id"));
    }
    const order = await Order.findById(orderId);
    if (!order) return next(createHttpError(404, "Order not found"));
    //dbl payment
    if (order.orderStatus !== "PAYMENT_PENDING") {
      return next(
        createHttpError(
          400,
          `Cannot process cash payment for order in status ${order.orderStatus}`
        )
      );
    }

    const amount = order.bills.totalWithTax;
    const payment = await Payment.create({
      orderId: order._id,
      amount,
      provider: "CASH",
      status: "SUCCESS",
      transaction: {
        tran_id: new mongoose.Types.ObjectId().toString(),
      },
      isFinalized: true,
    });

    order.orderStatus = "PAYMENT_COMPLETED";
    //update table
    const table = await tableModel.findById(order.table);
    table.status = "Booked";
    table.currentOrder = order._id;
    await table.save();
    // await tableModel.findByIdAndUpdate(order.table, {
    //   status: "Bokked",
    //   currentOrder: orderId
    // })

    order.payment = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      paymentId: payment._id,
      orderId: order._id,
      message: "Cash payment sucessfully completed",
    });
  } catch (error) {
    next(error);
  }
};

const getReceipt = async (req, res, next) => {
  try {
    /**
       ** Transaction id based**
    
    const { tran_id } = req.params;

    if (!tran_id || !mongoose.Types.ObjectId.isValid(tran_id)) {
      return next(createHttpError(400, "Missing or invalid Transaction id"));
    }

    const payment = await Payment.findById(tran_id).populate({
      path: "orderId",
      populate: {
        path: "table"
      }
    });

    if (!payment) return next(createHttpError(404, "Payment not found"));

    if (!payment.isFinalized ||  payment.status !== "SUCCESS")
      return next(createHttpError(404, "Payment not successful"));

    const order = payment.orderId;
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }
 */

    /**
     * OrderId based
     */

    const { orderId } = req.params;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createHttpError(400, "Invalid order ID"));
    }
    const order = await Order.findById(orderId)
      .populate("table")
      .populate("payment");

    if (!order || !order.payment) {
      return next(createHttpError(404, "Receipt not found"));
    }

    const payment = order.payment;

    if (!payment.isFinalized || payment.status !== "SUCCESS") {
      return next(createHttpError(400, "Receipt not avilable"));
    }

    const gateway =
      payment.provider === "SSLCOMMERZ"
        ? {
            bank_tran_id: payment.transaction.gateway_tran_id,
            channel: payment.gatewayResponse?.card_type,
            riskTitle: payment.gatewayResponse?.risk_title,
            riskLvl: payment.gatewayResponse?.risk_level,
            cardTranDate: payment.gatewayResponse?.tran_date,
          }
        : null;

    res.status(200).json({
      success: true,
      receipt: {
        receiptNo: order._id,
        transactionId: payment._id,
        amount: payment.amount,
        method: payment.provider,
        paidAt: payment.createdAt,
      },
      gateway,

      order: {
        customer: order.customerDetails,
        items: order.items,
        bills: order.bills,
        table: order.table,
        date: order.orderDate,
      },
      message: "Receipt generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const validatePayment = async (req, res, next) => {
  try {
    /* 
    const { val_id} = req.body;
    if(!val_id) return next (createHttpError(400, "Invalid payment validation request"))
      // call SSLCommerz validation API
    const data = await sslcz.validate({val_id})
    if(data.status !== "VALID") {
      return next(createHttpError(400, "Payment validation failed"))
    }
    const payment = await Payment.findById(data.tran_id)
    if(!payment) {
      return next(createHttpError(404, "Payment record not found: validation"))
    }

    // check for double validation
    if(payment.status === "SUCCESS") {
      return res.status(200).json({success: true})
    }

    // update payment record
    payment.status = "SUCCESS"
    payment.transaction = {
      tran_id: data.tran_id,
      gateway_tran_id: data.bank_tran_id,
      val_id: data.val_id
    }

    payment.gatewayResponse = data;
    await payment.save();
*/

    const { paymentId } = req.body;
    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId))
      return next(createHttpError(400, "Invalid payment validation request"));

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(createHttpError(404, "Payment record not found: validation"));
    }

    // prevent double validation
    if (payment.status === "SUCCESS") {
      return res
        .status(200)
        .json({ success: true, message: "Payment already validated" });
    }

    // ensure val id
    if (!payment.transaction?.val_id) {
      return next(createHttpError(400, "No val id found for payment"));
    }

    //call SSLCommerz validation API
    const data = await sslcz.validate({ val_id: payment.transaction.val_id });

    if (data.status !== "VALID") {
      payment.status = "FAILED";
      payment.gatewayResponse = data;
      await payment.save();
      return next(createHttpError(400, "Payment validation failed"));
    }

    // update payment record
    payment.status = "SUCCESS";
    payment.gatewayResponse = data;
    await payment.save();

    // update order record
    const order = await Order.findById(payment.orderId);
    order.orderStatus = "PAYMENT_COMPLETED";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment validated successfully",
      orderId: order._id,
    });
  } catch (error) {
    return next(error);
  }
};

/*
=====================================================
        IPN (BACKUP)
=====================================================
*/

const paymentIPN = async (req, res, next) => {
  try {
    req.body = { val_id: req.body.val_id };
    return validatePayment(req, res, next);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  initPayment,
  paymentSuccess,
  paymentFailure,
  paymentCancel,
  validatePayment,
  paymentIPN,
  getReceipt,
  cashPayment,
};
