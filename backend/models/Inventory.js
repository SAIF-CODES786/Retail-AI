const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },

    openingStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    quantitySold: {
      type: Number,
      default: 0,
      min: 0,
    },

    closingStock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);