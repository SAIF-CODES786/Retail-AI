
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");

const getReorderRecommendations = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [inventory, salesData] = await Promise.all([
      Inventory.find().populate({
        path: "product",
        populate: {
          path: "supplier",
          select: "name phone email leadTime",
        },
      }),

      Sale.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: "$product",
            totalSold: { $sum: "$quantitySold" },
          },
        },
      ]),
    ]);

    const salesMap = {};

    salesData.forEach((sale) => {
      salesMap[sale._id.toString()] = sale.totalSold;
    });

    const recommendations = inventory
      .filter((item) => item.product)
      .map((item) => {
        const product = item.product;
        const currentStock = Number(item.closingStock || 0);

        const totalSold = salesMap[product._id.toString()] || 0;
        const averageDailySales = totalSold / 30;

        const leadTime = Number(product.leadTime || 0);
        const minimumStock = Number(product.minimumStock || 0);
        const maximumStock = Number(product.maximumStock || 0);

        const reorderPoint = Math.max(
          minimumStock,
          Math.ceil(averageDailySales * leadTime * 1.2)
        );

        let priority = "Low";

        if (currentStock <= minimumStock) {
          priority = "High";
        } else if (currentStock <= reorderPoint) {
          priority = "Medium";
        }

        const targetStock =
          maximumStock > 0
            ? maximumStock
            : Math.max(minimumStock, reorderPoint);

        const recommendedQuantity = Math.max(
          0,
          targetStock - currentStock
        );

        return {
          product: product.name,
          productId: product.productId,
          currentStock,
          minimumStock,
          maximumStock,
          reorderPoint,
          averageDailySales: Number(
            averageDailySales.toFixed(2)
          ),
          recommendedQuantity,
          priority,

          supplier: product.supplier
            ? {
                name: product.supplier.name,
                phone: product.supplier.phone,
                email: product.supplier.email,
              }
            : null,

          estimatedCost: Number(
            (
              recommendedQuantity *
              Number(product.purchasePrice || 0)
            ).toFixed(2)
          ),
        };
      })
      .filter((item) => item.recommendedQuantity > 0)
      .sort((a, b) => {
        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    return res.status(200).json({
      message: "Reorder recommendations generated successfully",
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate reorder recommendations",
      error: error.message,
    });
  }
};

module.exports = { getReorderRecommendations };
