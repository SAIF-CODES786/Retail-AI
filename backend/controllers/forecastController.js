const Forecast = require("../models/Forecast");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const Sale = require("../models/Sale");
const { predictRetailSales } = require("../services/mlService");


const predictForecast = async (req, res) => {
  try {
    const { productId, forecastDate, horizon } = req.body;

    if (!productId || !forecastDate || !horizon) {
      return res.status(400).json({
        message: "Product, forecast date and horizon are required.",
      });
    }

    const product = await Product.findById(productId)
      .populate("outlet");

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const outlet = product.outlet;

    if (!outlet) {
      return res.status(400).json({
        message: "Product outlet is missing.",
      });
    }

   if (
  product.itemWeight == null ||
  product.itemWeight === "" ||
  !product.itemFatContent ||
  product.itemVisibility == null ||
  product.itemVisibility === "" ||
  !product.itemType ||
  product.itemMRP == null ||
  product.itemMRP === ""
) {
      return res.status(400).json({
        message: "Please complete all Big Mart ML fields in the product.",
      });
    }

    const inputData = {
      Item_Identifier: product.productId,
      Item_Weight: product.itemWeight,
      Item_Fat_Content: product.itemFatContent,
      Item_Visibility: product.itemVisibility,
      Item_Type: product.itemType,
      Item_MRP: product.itemMRP,
      Outlet_Identifier: outlet.outletIdentifier,
      Outlet_Establishment_Year: outlet.establishmentYear,
      Outlet_Size: outlet.outletSize,
      Outlet_Location_Type: outlet.locationType,
      Outlet_Type: outlet.outletType,
    };

    const prediction = await predictRetailSales(inputData);

    const forecast = await Forecast.create({
      product: product._id,
      forecastDate,
      horizon: Number(horizon),
      predictedSales: Number(prediction.predicted_sales),
      modelUsed: "Random Forest Regressor",
    });

    res.status(201).json({
      message: "ML prediction generated successfully.",
      forecast,
      prediction: prediction.predicted_sales,
    });

  } catch (error) {
    res.status(500).json({
      message: "ML prediction failed.",
      error: error.message,
    });
  }
};


// CREATE FORECAST
const createForecast = async (req, res) => {
  try {
    const forecast = await Forecast.create(req.body);

    res.status(201).json({
      message: "Forecast saved successfully",
      forecast,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save forecast",
      error: error.message,
    });
  }
};

// GET ALL FORECASTS
const getForecasts = async (req, res) => {
  try {
    const forecasts = await Forecast.find()
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: forecasts.length,
      forecasts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch forecasts",
      error: error.message,
    });
  }
};

// GET FORECAST BY ID
const getForecastById = async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id)
      .populate("product");

    if (!forecast) {
      return res.status(404).json({
        message: "Forecast not found",
      });
    }

    res.status(200).json({ forecast });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch forecast",
      error: error.message,
    });
  }
};

// DELETE FORECAST
const deleteForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findByIdAndDelete(req.params.id);

    if (!forecast) {
      return res.status(404).json({
        message: "Forecast not found",
      });
    }

    res.status(200).json({
      message: "Forecast deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete forecast",
      error: error.message,
    });
  }
};


const getForecastComparisons = async (req, res) => {
  try {
    // Populate nahi karenge; product ObjectId directly milega
    const forecasts = await Forecast.find()
      .sort({ forecastDate: -1 });

    const comparisons = await Promise.all(
      forecasts.map(async (forecast) => {

        // Product reference missing ho toh safely skip
        if (!forecast.product) {
          return {
            forecastId: forecast._id,
            product: null,
            forecastDate: forecast.forecastDate,
            horizon: forecast.horizon,
            predictedSales: forecast.predictedSales,
            actualSales: null,
            variance: null,
            accuracy: null,
            message: "Product reference is missing",
          };
        }

        const startDate = new Date(forecast.forecastDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(
          endDate.getDate() + Number(forecast.horizon)
        );

        const result = await Sale.aggregate([
          {
            $match: {
              product: forecast.product,
              date: {
                $gte: startDate,
                $lt: endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              actualSales: { $sum: "$revenue" },
            },
          },
        ]);

        const actualSales = result[0]?.actualSales || 0;
        const predictedSales = forecast.predictedSales;
        const variance = actualSales - predictedSales;

        const accuracy =
          actualSales > 0
            ? Math.max(
                0,
                (1 - Math.abs(variance) / actualSales) * 100
              )
            : null;

        forecast.actualSales = actualSales;
        await forecast.save();

        const productDetails = await Product.findById(
          forecast.product
        ).select("name productId");

        return {
          forecastId: forecast._id,
          product: productDetails,
          forecastDate: forecast.forecastDate,
          horizon: forecast.horizon,
          predictedSales,
          actualSales,
          variance,
          accuracy,
        };
      })
    );

    res.status(200).json({
      message: "Forecast comparisons fetched successfully",
      comparisons,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  createForecast,
  getForecasts,
  getForecastById,
  deleteForecast,
  predictForecast,
  getForecastComparisons,
};