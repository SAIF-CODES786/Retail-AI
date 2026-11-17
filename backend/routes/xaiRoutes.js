const express = require("express");

const {
  getModelExplanation,
} = require("../controllers/xaiController");

const router = express.Router();

router.get("/", getModelExplanation);

module.exports = router;