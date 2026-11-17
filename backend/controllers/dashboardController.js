
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Expense = require("../models/Expense");

const getDashboard = async (req, res) => {
  try {
    const [
      totalProducts,
      totalSales,
      revenueResult,
      totalInventoryItems,
      expenseResult,
      recentSales,
    ] = await Promise.all([
      Product.countDocuments(),
      Sale.countDocuments(),

      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$revenue" },
          },
        },
      ]),

      Inventory.countDocuments(),

      Expense.aggregate([
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: "$amount" },
          },
        },
      ]),

      Sale.find()
        .populate("product", "name productId")
        .sort({ date: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      summary: {
        totalProducts,
        totalSales,
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        totalInventoryItems,
        totalExpenses: expenseResult[0]?.totalExpenses || 0,
      },
      recentSales,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

module.exports = { getDashboard };
