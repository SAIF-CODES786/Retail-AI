const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    forecastDate: {
      type: Date,
      required: true,
    },

    horizon: {
      type: Number,
      required: true,
      min: 1,
    },

    predictedDemand: {
      type: Number,
      required: false,
      min: 0,
    },

    modelUsed: {
      type: String,
      required: true,
      trim: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },

    predictedSales: {
      type: Number,
      min: 0,
},

actualSales: {
  type: Number,
  min: 0,
},

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Forecast", forecastSchema);