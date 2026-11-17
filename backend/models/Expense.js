const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);