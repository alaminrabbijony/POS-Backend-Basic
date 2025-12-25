const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
  paymentSuccess,
  paymentFailure,
  initPayment,
  paymentCancel,
  validatePayment,
  paymentIPN,
  getReceipt,
} = require("../controllers/paymentController");

router.post("/init", isVerifiedUser, initPayment);
router.post("/success", paymentSuccess);
router.post("/failure", paymentFailure);
router.post("/cancel", paymentCancel);
router.post("/ipn", paymentIPN); // SSLCommerz will call this endpoint for IPN (backup)
router.get("/receipt/:tran_id",isVerifiedUser, getReceipt);

module.exports = router;
