const SSLCommerzPayment = require("sslcommerz-lts");
const config = require("../../config/config");
const paymentModel = require("../../models/paymentModel");
const orderModel = require("../../models/orderModel");
const tableModel = require("../../models/tableModel");

const frontendBaseURL = config.frontendBaseURL;

const sslcz = new SSLCommerzPayment(
  config.sslcommerz.storeId,
  config.sslcommerz.storePassword,
  false //true for live, false for sandbox
);

const paymentProcessor = async ({ req, res, finalStatus }) => {
  const { tran_id, val_id } = req.body;
  const failure = `${frontendBaseURL}/payment/failure`;

  if (!tran_id) {
    return res.redirect(failure);
  }

  const payment = await paymentModel.findById(tran_id);
  if (!payment) return res.redirect(failure);

  const orderId = payment.orderId;

  const successWithOrderId = `${frontendBaseURL}/payment/success?orderId=${orderId}`;
  const failureWithOrderId = `${frontendBaseURL}/payment/failure?orderId=${orderId}`;

  // double payment sucess aka idempotency lock

  if (payment.isFinalized) {
    return res.redirect(
      payment.status === "SUCCESS" ? successWithOrderId : failureWithOrderId
    );
  }

  const order = await orderModel.findById(payment.orderId)
  const table = await tableModel.findById(order.table)
  //SUCCESS FLOW

  

  if (finalStatus === "SUCCESS") {
    if (!val_id) {
      payment.status = "FAILED";
      payment.failureReason = "Payment validation failed";
      payment.isFinalized = true;
      await payment.save();

      /* Auto update */
      // await orderModel.findByIdAndUpdate(payment.orderId, {
      //   orderStatus: "PAYMENT_FAILED",
      // });

      order.orderStatus = "PAYMENT_FAILED"
      table.status = "Available"
      await table.save()
      await order.save()

      return res.redirect(failureWithOrderId);
    }

    const data = await sslcz.validate({ val_id });

    if (data.status !== "VALID") {
      payment.status = "FAILED";
      payment.gatewayResponse = data;
      payment.failureReason =
        data.error ||
        data.failedreason ||
        data.status ||
        "Payment validation failed";
      payment.isFinalized = true;
      await payment.save();
      return res.redirect(failureWithOrderId);
    }

    payment.status = "SUCCESS";
    payment.transaction = {
      tran_id,
      gateway_tran_id: data.bank_tran_id,
      val_id,
    };
    payment.gatewayResponse = data;
    payment.isFinalized = true;
    await payment.save();

    // await orderModel.findByIdAndUpdate(payment.orderId, {
    //   orderStatus: "PAYMENT_COMPLETED",
    //   payment: payment._id,
    // });

    
      order.orderStatus = "PAYMENT_COMPLETED"
      order.payment = payment._id
      table.status = "Booked"
      await table.save()
      await order.save()
    return res.redirect(successWithOrderId);
  }

  // other final status

  payment.status = finalStatus;
  payment.gatewayResponse = req.body;
  payment.isFinalized = true;
  payment.failureReason =
    req.body?.error || req.body?.failedreason || "Payment failed or cancelled";

  await payment.save();
  await orderModel.findByIdAndUpdate(payment.orderId, {
    orderStatus: "PAYMENT_FAILED",
  });

  return res.redirect(failureWithOrderId);
};

module.exports = paymentProcessor;
