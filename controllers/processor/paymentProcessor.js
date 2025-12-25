const SSLCommerzPayment = require("sslcommerz-lts");
const config = require("../../config/config");
const paymentModel = require("../../models/paymentModel");
const orderModel = require("../../models/orderModel");

const frontendBaseURL = config.frontendBaseURL;

const sslcz = new SSLCommerzPayment(
  config.sslcommerz.storeId,
  config.sslcommerz.storePassword,
  false //true for live, false for sandbox
);

const paymentProcessor = async ({ req, res, finalStatus }) => {
  const { tran_id, val_id } = req.body;
  const failure = `${frontendBaseURL}/payment/failure`;

  const successWithTranId = `${frontendBaseURL}/payment/success?tran_id=${tran_id}`;
  const failureWithTranId = `${frontendBaseURL}/payment/failure?tran_id=${tran_id}`;

  if (!tran_id) {
    return res.redirect(failure);
  }

  const payment = await paymentModel.findById(tran_id);

  if (!payment) return res.redirect(failure);

  // double payment sucess aka idempotency lock

  if (payment.isFinalized) {
    return res.redirect(
      payment.status === "SUCCESS" ? successWithTranId : failureWithTranId
    );
  }

  //SUCCESS FLOW

  if (finalStatus === "SUCCESS") {
    if (!val_id) {
      payment.status = "FAILED";
      payment.failureReason = "Payment validation failed";
      payment.isFinalized = true;
      await payment.save();
      await orderModel.findByIdAndUpdate(payment.orderId, {
        orderStatus: "PAYMENT_FAILED",
      });

      return res.redirect(failureWithTranId);
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
      return res.redirect(failureWithTranId);
    }

    payment.status = "SUCCESS";
    payment.transcation = {
      tran_id,
      gateway_tran_id: data.bank_tran_id,
      val_id,
    };
    payment.gatewayResponse = data;
    payment.isFinalized = true;
    await payment.save();

    await orderModel.findByIdAndUpdate(payment.orderId, {
      orderStatus: "PAYMENT_COMPLETED",
    });

    return res.redirect(successWithTranId);
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

  return res.redirect(failureWithTranId);
};

module.exports = paymentProcessor;
