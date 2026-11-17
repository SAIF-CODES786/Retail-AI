const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Inventory = require("../models/Inventory");

// CREATE PURCHASE
const createPurchase = async (req, res) => {
  const { date, product, supplier, quantity, purchasePrice } = req.body;

  if (
    !date ||
    !product ||
    !supplier ||
    quantity === undefined ||
    purchasePrice === undefined
  ) {
    return res.status(400).json({
      message:
        "Date, product, supplier, quantity aur purchase price required hain.",
    });
  }

  if (
    !mongoose.isValidObjectId(product) ||
    !mongoose.isValidObjectId(supplier) ||
    !Number.isFinite(new Date(date).getTime())
  ) {
    return res.status(400).json({
      message: "Invalid date, product ID ya supplier ID.",
    });
  }

  const qty = Number(quantity);
  const price = Number(purchasePrice);

  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({
      message: "Quantity kam se kam 1 honi chahiye.",
    });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({
      message: "Purchase price valid hona chahiye.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdPurchase;
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const inventory = await Inventory.findOne({ product }).session(session);

      if (!inventory) {
        const error = new Error(
          "Is product ka inventory record nahi hai. Pehle Inventory page par record banao."
        );
        error.statusCode = 404;
        throw error;
      }

      inventory.stockReceived =
        Number(inventory.stockReceived) + qty;

      inventory.closingStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        Number(inventory.quantitySold);

      if (inventory.closingStock < 0) {
        const error = new Error("Purchase ke baad inventory invalid ho rahi hai.");
        error.statusCode = 400;
        throw error;
      }

      await inventory.save({ session });

      const purchase = new Purchase({
        date,
        product,
        supplier,
        quantity: qty,
        purchasePrice: price,
        totalCost: qty * price,
      });

      await purchase.save({ session });

      createdPurchase = purchase;
      updatedClosingStock = inventory.closingStock;
    });

    return res.status(201).json({
      message: "Purchase recorded and inventory updated successfully.",
      purchase: createdPurchase,
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to record purchase.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

// GET ALL PURCHASES
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("product")
      .populate("supplier")
      .sort({ date: -1 });

    return res.status(200).json({
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch purchases.",
      error: error.message,
    });
  }
};

// GET SINGLE PURCHASE
const getPurchaseById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid purchase ID.",
      });
    }

    const purchase = await Purchase.findById(req.params.id)
      .populate("product")
      .populate("supplier");

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found.",
      });
    }

    return res.status(200).json({ purchase });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch purchase.",
      error: error.message,
    });
  }
};

// UPDATE PURCHASE
const updatePurchase = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid purchase ID.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedPurchase;
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(req.params.id).session(session);

      if (!purchase) {
        const error = new Error("Purchase not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        req.body.product &&
        String(req.body.product) !== String(purchase.product)
      ) {
        const error = new Error(
          "Existing purchase ka product change nahi kar sakte."
        );
        error.statusCode = 400;
        throw error;
      }

      const quantity =
        req.body.quantity === undefined
          ? Number(purchase.quantity)
          : Number(req.body.quantity);

      const purchasePrice =
        req.body.purchasePrice === undefined
          ? Number(purchase.purchasePrice)
          : Number(req.body.purchasePrice);

      const date = req.body.date ?? purchase.date;
      const supplier = req.body.supplier ?? purchase.supplier;

      if (!Number.isInteger(quantity) || quantity < 1) {
        const error = new Error("Quantity kam se kam 1 honi chahiye.");
        error.statusCode = 400;
        throw error;
      }

      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        const error = new Error("Purchase price valid hona chahiye.");
        error.statusCode = 400;
        throw error;
      }

      if (!Number.isFinite(new Date(date).getTime())) {
        const error = new Error("Invalid purchase date.");
        error.statusCode = 400;
        throw error;
      }

      if (!mongoose.isValidObjectId(supplier)) {
        const error = new Error("Invalid supplier ID.");
        error.statusCode = 400;
        throw error;
      }

      const inventory = await Inventory.findOne({
        product: purchase.product,
      }).session(session);

      if (!inventory) {
        const error = new Error(
          "Purchase ke product ka inventory record nahi mila."
        );
        error.statusCode = 404;
        throw error;
      }

      const quantityDifference =
        quantity - Number(purchase.quantity);

      const newStockReceived =
        Number(inventory.stockReceived) + quantityDifference;

      const newClosingStock =
        Number(inventory.openingStock) +
        newStockReceived -
        Number(inventory.quantitySold);

      if (newStockReceived < 0 || newClosingStock < 0) {
        const error = new Error(
          "Purchase update se stock negative ho jayega. Operation cancelled."
        );
        error.statusCode = 400;
        throw error;
      }

      inventory.stockReceived = newStockReceived;
      inventory.closingStock = newClosingStock;

      await inventory.save({ session });

      purchase.date = date;
      purchase.supplier = supplier;
      purchase.quantity = quantity;
      purchase.purchasePrice = purchasePrice;
      purchase.totalCost = quantity * purchasePrice;

      await purchase.save({ session });

      updatedPurchase = purchase;
      updatedClosingStock = inventory.closingStock;
    });

    return res.status(200).json({
      message: "Purchase and inventory updated successfully.",
      purchase: updatedPurchase,
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to update purchase.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

// DELETE PURCHASE
const deletePurchase = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid purchase ID.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(req.params.id).session(session);

      if (!purchase) {
        const error = new Error("Purchase not found.");
        error.statusCode = 404;
        throw error;
      }

      const inventory = await Inventory.findOne({
        product: purchase.product,
      }).session(session);

      if (!inventory) {
        const error = new Error(
          "Purchase ke product ka inventory record nahi mila."
        );
        error.statusCode = 404;
        throw error;
      }

      const newStockReceived =
        Number(inventory.stockReceived) - Number(purchase.quantity);

      const newClosingStock =
        Number(inventory.openingStock) +
        newStockReceived -
        Number(inventory.quantitySold);

      if (newStockReceived < 0 || newClosingStock < 0) {
        const error = new Error(
          "Purchase delete nahi ho sakti: isse inventory stock negative ho jayega."
        );
        error.statusCode = 400;
        throw error;
      }

      inventory.stockReceived = newStockReceived;
      inventory.closingStock = newClosingStock;

      await inventory.save({ session });

      await Purchase.deleteOne(
        { _id: purchase._id },
        { session }
      );

      updatedClosingStock = inventory.closingStock;
    });

    return res.status(200).json({
      message: "Purchase deleted and inventory updated successfully.",
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to delete purchase.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
};