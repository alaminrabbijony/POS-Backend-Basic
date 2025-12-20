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
} = require("../controllers/paymentController");

router.post("/init", isVerifiedUser, initPayment);
router.post("/success", paymentSuccess);
router.post("/failure", paymentFailure);
router.post("/cancel", paymentCancel);
router.post("/validate", validatePayment); // SSLCommerz will call this endpoint to validate payment
router.post("/ipn", paymentIPN); // SSLCommerz will call this endpoint for IPN (backup)
module.exports = router;
