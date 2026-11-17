const express = require("express");

const {
  getReorderRecommendations,
} = require("../controllers/reorderController");

const router = express.Router();

router.get("/", getReorderRecommendations);

module.exports = router;
