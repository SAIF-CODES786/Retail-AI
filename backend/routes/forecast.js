const express = require("express");

const {
  createForecast,
  getForecasts,
  getForecastById,
  deleteForecast,
  predictForecast,
  getForecastComparisons,
} = require("../controllers/forecastController");

const router = express.Router();

router.post("/", createForecast);
router.get("/", getForecasts);

router.get("/comparison", getForecastComparisons);

router.post("/predict", predictForecast);
router.get("/:id", getForecastById);
router.delete("/:id", deleteForecast);

module.exports = router;