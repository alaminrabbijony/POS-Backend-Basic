const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
  addTable,
  getTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");
const router = express.Router();

//Table routes

router.route("/").post(isVerifiedUser, addTable);
router.route("/").get(isVerifiedUser, getTable);
router.route("/:id").put(isVerifiedUser, updateTable);
router.route("/:id").delete(isVerifiedUser, deleteTable)


module.exports = router;
