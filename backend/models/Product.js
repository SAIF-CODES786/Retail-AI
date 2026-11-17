const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },



itemType: {
  type: String,
  enum: [
    "Baking Goods",
    "Breads",
    "Breakfast",
    "Canned",
    "Dairy",
    "Frozen Foods",
    "Fruits and Vegetables",
    "Hard Drinks",
    "Health and Hygiene",
    "Household",
    "Meat",
    "Others",
    "Seafood",
    "Snack Foods",
    "Soft Drinks",
    "Starchy Foods",
  ],
},


        // Big Mart ML Features
    itemWeight: {
      type: Number,
      min: 0,
    },

    itemFatContent: {
      type: String,
      enum: ["Low Fat", "Regular"],
    },

    itemVisibility: {
      type: Number,
      min: 0,
    },

    itemMRP: {
      type: Number,
      min: 0,
    },

    subcategory: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    outlet: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Outlet",
  required: true,
},

    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    leadTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);