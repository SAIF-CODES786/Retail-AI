const mongoose = require("mongoose");

const outletSchema = new mongoose.Schema(
  {
    outletIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    establishmentYear: {
      type: Number,
      required: true,
    },

    outletSize: {
      type: String,
      enum: ["Small", "Medium", "High"],
      required: true,
    },

    locationType: {
      type: String,
      enum: ["Tier 1", "Tier 2", "Tier 3"],
      required: true,
    },

    outletType: {
      type: String,
      enum: [
        "Grocery Store",
        "Supermarket Type1",
        "Supermarket Type2",
        "Supermarket Type3",
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Outlet", outletSchema);