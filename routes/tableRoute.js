const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
  addTable,
  getTable,
  updateTable,
} = require("../controllers/tableController");
const router = express.Router();

//Table routes

router.route("/").post(isVerifiedUser, addTable);
router.route("/").get(isVerifiedUser, getTable);
router.route("/:id").get(isVerifiedUser, updateTable);

module.exports = router;
