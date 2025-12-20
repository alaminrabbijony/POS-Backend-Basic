const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");

/*
=====================================================
CREATE ORDER
- Creates order ONLY
- Payment is handled separately
=====================================================
*/
const addOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    console.log("Received order data:", orderData);

    // Force initial state
    orderData.orderStatus = "CREATED";

    const order = new Order(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      data: order,
      message: "Order created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
GET ORDER BY ID
=====================================================
*/
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid order id"));
    }

    const order = await Order.findById(id).populate("table");

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
GET ALL ORDERS
=====================================================
*/
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
UPDATE ORDER STATUS
⚠️ Should be ADMIN / INTERNAL ONLY
=====================================================
*/
const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid order id"));
    }

    const allowedStatuses = [
      "CREATED",
      "PAYMENT_PENDING",
      "PAYMENT_COMPLETED",
      "PAYMENT_FAILED",
      "RECEIPT_GENERATED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return next(createHttpError(400, "Invalid order status"));
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    res.status(200).json({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
GENERATE RECEIPT
- Allowed ONLY after payment success
=====================================================
*/
const getReceipt = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createHttpError(400, "Invalid order id"));
    }

    const order = await Order.findById(orderId).populate("table");
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    if (order.orderStatus !== "PAYMENT_COMPLETED") {
      return next(
        createHttpError(400, "Payment not completed for this order")
      );
    }

    order.orderStatus = "RECEIPT_GENERATED";
    await order.save();

    res.status(200).json({
      success: true,
      customer: order.customerDetails,
      items: order.items,
      bills: order.bills,
      table: order.table,
      date: order.orderDate,
      message: "Receipt generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
  getReceipt,
};
