const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");
const tableModel = require("../models/tableModel");

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
    // validate table first
    const table = await tableModel.findById(orderData.table);

    if (!table) return next(createHttpError(404, "Table is missing: addOrder"));

    if (table.status === "Booked") {
      return next(createHttpError(409, "Table is already Booked"));
    }
    // create order
    const order = await Order.create(orderData);

    //update table status
    table.status = "Booked";
    table.currentOrder = order._id;
    await table.save();

    // populate table
    const populatedOrder = await Order.findById(order._id).populate("table")

    res.status(201).json({
      success: true,
      data: populatedOrder,
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
// const getAllOrders = async (req, res, next) => {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 }).populate("payment");

//     res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (error) {
//     next(error);
//   }
// };


const getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      from,
      to,
    } = req.query;

    const safeLimit = Math.min(Number(limit), 50); // hard cap
    const skip = (Number(page) - 1) * safeLimit;

    /* FILTERS */
    const filter = {};

    if (status) {
      filter.orderStatus = status;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    /*QUERY */
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select(
          "_id orderStatus orderDate items bills table customerDetails payment createdAt"
        )
        .populate({
          path: "payment",
          select: "provider status amount updatedAt",
        })
        .populate({
          path: "table",
          select: "tableNo",
        })
        .lean(),

      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      meta: {
        page: Number(page),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};


/*
=====================================================
UPDATE ORDER STATUS
Should be ADMIN / INTERNAL ONLY
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

module.exports = {
  addOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
};
