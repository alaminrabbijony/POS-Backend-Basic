const Payment = require("../models/paymentModel");

class FakePaymentProvider {
  async createPayment({ amount, orderId }) {
    const payment = await Payment({
      provider: "FAKE",
      amount,
      orderId,
      status: "INITIATED",
    });
    return {
      paymentId: payment._id,
      redirectUrl: null,
    };
  }
  async verifyPayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!paymentId) {
      throw new Error("Payment not found (fakePaymentProvider File)");
    }
    payment.status = "PAID";
    payment.providerTransactionId = `FAKE-${Date.now()}`;
    await payment.save();

    return payment;
  }
}

module.exports = FakePaymentProvider;
