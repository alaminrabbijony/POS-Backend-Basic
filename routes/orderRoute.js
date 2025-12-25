const express = require("express");
const {
  addOrder,
  getAllOrders,
  updateOrder,
  getOrderById,
  getReceipt,
} = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Order routes
router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getAllOrders);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, updateOrder);

module.exports = router;
