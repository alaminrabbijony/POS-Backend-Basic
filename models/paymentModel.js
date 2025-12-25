const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // In tutorial phase, order may not exist yet
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Required even in tutorial
    amount: {
      type: Number,
      required: true,
    },

    // REQUIRED — this fixes the provider error
    provider: {
      type: String,
      enum: ["SSLCOMMERZ", "CASH"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    // all gateway related ids
    transcation: {
      tran_id: String, //POS System id
      gateway_tran_id: String, // SSLCommerz bank_tran_id
      val_id: String, // // SSLCommerz validation id
    },
 // Full response from gateway (never trust only some fields)
    gatewayResponse: Object,

 // for getting clean res
    failureRes: String,
    isFinalized: {
      type: Boolean,
      defaullt: false
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
