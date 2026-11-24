const express = require("express");

const {
  getModelExplanation,
} = require("../controllers/xaiController");

const router = express.Router();

// Temporary test route
router.get("/test", (req, res) => {
  res.json({
    message: "XAI route is working!"
  });
});

router.get("/", getModelExplanation);

module.exports = router;