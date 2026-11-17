
const express = require("express");

const {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryRecommendations,
} = require("../controllers/inventoryController");

const router = express.Router();

router.post("/", createInventory);
router.get("/", getInventory);

// Recommendations route
router.get("/recommendations", getInventoryRecommendations);

router.get("/:id", getInventoryById);
router.put("/:id", updateInventory);
router.delete("/:id", deleteInventory);

module.exports = router;
