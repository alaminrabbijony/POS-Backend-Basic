const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
  
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      guests: { type: Number, required: true },
    },

    /*
    =========================================
    ORDER STATUS (SYSTEM CONTROLLED)
    Frontend MUST NOT set this manually
    =========================================
    */
    orderStatus: {
      type: String,
      enum: [
        "CREATED",              // Order created, no payment yet
        "PAYMENT_PENDING",      // Payment session created
        "PAYMENT_COMPLETED",    // Payment VALIDATED (money confirmed)
        "PAYMENT_FAILED",       // Payment failed / cancelled
        "RECEIPT_GENERATED",    // Receipt printed/generated
      ],
      default: "CREATED",
    },

    orderDate: {
      type: Date,
      default: Date.now(),
    },

    bills: {
      total: { type: Number, required: true },
      tax: { type: Number, required: true },
      totalWithTax: { type: Number, required: true },
    },

    items: [
      // {
      //   itemName: { type: String, required: true },
      //   price: { type: Number, required: true },
      //   quantity: { type: Number, required: true },
      // },
    ],
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
    },

    /*
    =========================================
    OPTIONAL PAYMENT REFERENCE
    (Useful for receipt & refunds)
    =========================================
    */
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
