const express = require("express");
const router = express.Router();

const {
  createOutlet,
  getOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
} = require("../controllers/outletController");

router.post("/", createOutlet);
router.get("/", getOutlets);
router.get("/:id", getOutletById);
router.put("/:id", updateOutlet);
router.delete("/:id", deleteOutlet);

module.exports = router;