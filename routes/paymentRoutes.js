const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
  paymentSuccess,
  paymentFailure,
  initPayment,
  paymentCancel,
  paymentIPN,
  getReceipt,
  cashPayment,
} = require("../controllers/paymentController");

router.post("/init", isVerifiedUser, initPayment);
router.post("/success", paymentSuccess);
router.post("/failure", paymentFailure);
router.post("/cancel", paymentCancel);
router.post("/ipn", paymentIPN); // SSLCommerz will call this endpoint for IPN (backup)
router.get("/receipt/:orderId",isVerifiedUser, getReceipt);
router.post("/cash", isVerifiedUser, cashPayment)
module.exports = router;
