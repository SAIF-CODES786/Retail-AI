const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");

// CREATE INVENTORY
const createInventory = async (req, res) => {
  try {
    const {
      product,
      openingStock = 0,
      stockReceived = 0,
      quantitySold = 0,
    } = req.body;

    if (!product || !mongoose.isValidObjectId(product)) {
      return res.status(400).json({
        message: "Valid product ID required.",
      });
    }

    const opening = Number(openingStock);
    const received = Number(stockReceived);
    const sold = Number(quantitySold);

    if (
      !Number.isFinite(opening) ||
      !Number.isFinite(received) ||
      !Number.isFinite(sold) ||
      opening < 0 ||
      received < 0 ||
      sold < 0 ||
      sold > opening + received
    ) {
      return res.status(400).json({
        message: "Invalid stock values. Stock negative nahi ho sakta.",
      });
    }

    // New inventory records start with zero transaction totals.
    // Existing purchases and sales are not automatically imported here.
    if (received !== 0 || sold !== 0) {
      return res.status(400).json({
        message: "Nayi inventory mein stockReceived aur quantitySold zero rakho. Purchases aur Sales se stock automatically update hoga.",
      });
    }

    const inventory = await Inventory.create({
      product,
      openingStock: opening,
      stockReceived: 0,
      quantitySold: 0,
      closingStock: opening,
    });

    return res.status(201).json({
      message: "Inventory created successfully.",
      inventory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create inventory.",
      error: error.message,
    });
  }
};

// GET ALL INVENTORY
const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch inventory.",
      error: error.message,
    });
  }
};

// GET SINGLE INVENTORY
const getInventoryById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid inventory ID.",
      });
    }

    const inventory = await Inventory.findById(req.params.id)
      .populate("product");

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found.",
      });
    }

    return res.status(200).json({ inventory });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch inventory.",
      error: error.message,
    });
  }
};

// UPDATE INVENTORY
const updateInventory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid inventory ID.",
      });
    }

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found.",
      });
    }

    const allowedFields = ["openingStock"];

    const attemptedFields = Object.keys(req.body);
    const forbiddenFields = attemptedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (forbiddenFields.length > 0) {
      return res.status(400).json({
        message: "Inventory page se sirf openingStock update kar sakte ho. Purchases aur Sales baaki stock fields manage karte hain.",
        forbiddenFields,
      });
    }

    const opening = Number(req.body.openingStock);

    if (
      req.body.openingStock === undefined ||
      !Number.isFinite(opening) ||
      opening < 0
    ) {
      return res.status(400).json({
        message: "Valid opening stock required.",
      });
    }

    const closing =
      opening +
      Number(inventory.stockReceived) -
      Number(inventory.quantitySold);

    if (closing < 0) {
      return res.status(400).json({
        message: "Opening stock change se closing stock negative ho jayega.",
      });
    }

    inventory.openingStock = opening;
    inventory.closingStock = closing;

    await inventory.save();

    return res.status(200).json({
      message: "Opening stock updated successfully.",
      inventory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update inventory.",
      error: error.message,
    });
  }
};

// DELETE INVENTORY
const deleteInventory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid inventory ID.",
      });
    }

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found.",
      });
    }

    const [purchaseExists, saleExists] = await Promise.all([
      Purchase.exists({ product: inventory.product }),
      Sale.exists({ product: inventory.product }),
    ]);

    if (purchaseExists || saleExists) {
      return res.status(400).json({
        message: "Is product ki sales ya purchase history hai. Pehle related records ko safely handle karo.",
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Inventory deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete inventory.",
      error: error.message,
    });
  }
};


// INVENTORY OPTIMIZATION RECOMMENDATIONS
const getInventoryRecommendations = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [inventory, salesData] = await Promise.all([
      Inventory.find().populate("product"),
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

        // 20% safety buffer
        const reorderPoint = Math.ceil(
          averageDailySales * leadTime * 1.2
        );

        const recommendedQuantity = Math.max(
          0,
          maximumStock - currentStock
        );

        let status = "Healthy";

        if (currentStock <= reorderPoint || currentStock <= minimumStock) {
          status = "Reorder Required";
        } else if (maximumStock > 0 && currentStock > maximumStock) {
          status = "Overstock";
        }

        return {
          product: product.name,
          productId: product.productId,
          currentStock,
          totalSoldLast30Days: totalSold,
          averageDailySales: Number(averageDailySales.toFixed(2)),
          leadTime,
          reorderPoint,
          recommendedQuantity:
            status === "Reorder Required"
              ? recommendedQuantity
              : 0,
          status,
        };
      });

    return res.status(200).json({
      message: "Inventory recommendations generated successfully.",
      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate inventory recommendations.",
      error: error.message,
    });
  }
};


module.exports = {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryRecommendations,
};
