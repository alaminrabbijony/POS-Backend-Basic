const createHttpError = require("http-errors");
const Order = require("../models/orderModel")

// Create Order
const addOrder = async (req, res, next) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.status(201).json({
      success: true,
      data: order,
      message: "Order added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get Order by ID
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

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

// Get All Orders
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Update Order
const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    res.status(200).json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getAllOrders, updateOrder };

        // Login
// {
//   "email": "test@example6.com",
//   "password": "Test@0246810"
// }


        // Add Order
// {
//   "customerDetails": {
//     "name": "John Doe",
//     "phone": "01812345678",
//     "guests": 2
//   },
//   "orderStatus": "In rogress",
//   "bills": {
//     "total": 450,
//     "tax": 67.5,
//     "totalWithTax": 517.5
//   },
//   "items": [
//     {
//       "itemName": "Coffee",
//       "price": 300,
//       "quantity": 1
//     }
//   ]
// }


// order id: 692e3898b5a070e3aa1857bd
