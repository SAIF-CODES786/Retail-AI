const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");

// Parse boolean values safely
const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return null;
};

// CREATE SALE
const createSale = async (req, res) => {
  const {
    date,
    product,
    quantitySold,
    sellingPrice,
    discount = 0,
    promotion = false,
  } = req.body;

  if (
    !date ||
    !product ||
    quantitySold === undefined ||
    sellingPrice === undefined
  ) {
    return res.status(400).json({
      message: "Date, product, quantity aur selling price required hain.",
    });
  }

  if (
    !mongoose.isValidObjectId(product) ||
    !Number.isFinite(new Date(date).getTime())
  ) {
    return res.status(400).json({
      message: "Invalid product ID ya date.",
    });
  }

  const quantity = Number(quantitySold);
  const price = Number(sellingPrice);
  const discountPerUnit = Number(discount);
  const isPromotion = parseBoolean(promotion);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      message: "Quantity kam se kam 1 honi chahiye.",
    });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({
      message: "Selling price valid hona chahiye.",
    });
  }

  if (
    !Number.isFinite(discountPerUnit) ||
    discountPerUnit < 0 ||
    discountPerUnit > price
  ) {
    return res.status(400).json({
      message: "Discount valid hona chahiye aur selling price se zyada nahi ho sakta.",
    });
  }

  if (isPromotion === null) {
    return res.status(400).json({
      message: "Promotion value true ya false honi chahiye.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdSale;
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const inventory = await Inventory.findOne({ product }).session(session);

      if (!inventory) {
        const error = new Error("Is product ka inventory record nahi mila.");
        error.statusCode = 404;
        throw error;
      }

      const availableStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        Number(inventory.quantitySold);

      if (quantity > availableStock) {
        const error = new Error(
          `Insufficient stock. Available stock: ${availableStock}`
        );
        error.statusCode = 400;
        throw error;
      }

      inventory.quantitySold = Number(inventory.quantitySold) + quantity;
      inventory.closingStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        Number(inventory.quantitySold);

      await inventory.save({ session });

      const sale = new Sale({
        date,
        product,
        quantitySold: quantity,
        sellingPrice: price,
        discount: discountPerUnit,
        promotion: isPromotion,
        revenue: quantity * (price - discountPerUnit),
      });

      await sale.save({ session });

      createdSale = sale;
      updatedClosingStock = inventory.closingStock;
    });

    return res.status(201).json({
      message: "Sale recorded and inventory updated successfully.",
      sale: createdSale,
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to record sale.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

// GET ALL SALES
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("product")
      .sort({ date: -1 });

    return res.status(200).json({
      count: sales.length,
      sales,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch sales.",
      error: error.message,
    });
  }
};

// GET SINGLE SALE
const getSaleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid sale ID." });
    }

    const sale = await Sale.findById(req.params.id).populate("product");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found." });
    }

    return res.status(200).json({ sale });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch sale.",
      error: error.message,
    });
  }
};

// UPDATE SALE
const updateSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid sale ID." });
  }

  const session = await mongoose.startSession();

  try {
    let updatedSale;
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const sale = await Sale.findById(req.params.id).session(session);

      if (!sale) {
        const error = new Error("Sale not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        req.body.product &&
        String(req.body.product) !== String(sale.product)
      ) {
        const error = new Error(
          "Existing sale ka product change nahi kar sakte."
        );
        error.statusCode = 400;
        throw error;
      }

      const quantity =
        req.body.quantitySold === undefined
          ? Number(sale.quantitySold)
          : Number(req.body.quantitySold);

      const price =
        req.body.sellingPrice === undefined
          ? Number(sale.sellingPrice)
          : Number(req.body.sellingPrice);

      const discount =
        req.body.discount === undefined
          ? Number(sale.discount)
          : Number(req.body.discount);

      const date = req.body.date ?? sale.date;

      const promotion = parseBoolean(req.body.promotion, sale.promotion);

      if (!Number.isInteger(quantity) || quantity < 1) {
        const error = new Error("Quantity kam se kam 1 honi chahiye.");
        error.statusCode = 400;
        throw error;
      }

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error("Selling price valid hona chahiye.");
        error.statusCode = 400;
        throw error;
      }

      if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > price
      ) {
        const error = new Error("Discount valid hona chahiye.");
        error.statusCode = 400;
        throw error;
      }

      if (
        !Number.isFinite(new Date(date).getTime()) ||
        promotion === null
      ) {
        const error = new Error("Sale date ya promotion value invalid hai.");
        error.statusCode = 400;
        throw error;
      }

      const inventory = await Inventory.findOne({
        product: sale.product,
      }).session(session);

      if (!inventory) {
        const error = new Error(
          "Sale ke product ka inventory record nahi mila."
        );
        error.statusCode = 404;
        throw error;
      }

      const quantityDifference = quantity - Number(sale.quantitySold);

      const availableStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        Number(inventory.quantitySold);

      if (quantityDifference > availableStock) {
        const error = new Error(
          `Insufficient stock. Available stock: ${availableStock}`
        );
        error.statusCode = 400;
        throw error;
      }

      const newQuantitySold =
        Number(inventory.quantitySold) + quantityDifference;

      const newClosingStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        newQuantitySold;

      if (newQuantitySold < 0 || newClosingStock < 0) {
        const error = new Error(
          "Sale update se inventory invalid ho jayegi."
        );
        error.statusCode = 400;
        throw error;
      }

      inventory.quantitySold = newQuantitySold;
      inventory.closingStock = newClosingStock;
      await inventory.save({ session });

      sale.date = date;
      sale.quantitySold = quantity;
      sale.sellingPrice = price;
      sale.discount = discount;
      sale.promotion = promotion;
      sale.revenue = quantity * (price - discount);

      await sale.save({ session });

      updatedSale = sale;
      updatedClosingStock = inventory.closingStock;
    });

    return res.status(200).json({
      message: "Sale and inventory updated successfully.",
      sale: updatedSale,
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to update sale.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

// DELETE SALE
const deleteSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid sale ID." });
  }

  const session = await mongoose.startSession();

  try {
    let updatedClosingStock;

    await session.withTransaction(async () => {
      const sale = await Sale.findById(req.params.id).session(session);

      if (!sale) {
        const error = new Error("Sale not found.");
        error.statusCode = 404;
        throw error;
      }

      const inventory = await Inventory.findOne({
        product: sale.product,
      }).session(session);

      if (!inventory) {
        const error = new Error(
          "Sale ke product ka inventory record nahi mila."
        );
        error.statusCode = 404;
        throw error;
      }

      const newQuantitySold =
        Number(inventory.quantitySold) - Number(sale.quantitySold);

      const newClosingStock =
        Number(inventory.openingStock) +
        Number(inventory.stockReceived) -
        newQuantitySold;

      if (newQuantitySold < 0 || newClosingStock < 0) {
        const error = new Error(
          "Sale delete nahi ho sakti: inventory sold quantity se match nahi karti."
        );
        error.statusCode = 400;
        throw error;
      }

      inventory.quantitySold = newQuantitySold;
      inventory.closingStock = newClosingStock;

      await inventory.save({ session });
      await Sale.deleteOne({ _id: sale._id }, { session });

      updatedClosingStock = inventory.closingStock;
    });

    return res.status(200).json({
      message: "Sale deleted and inventory updated successfully.",
      closingStock: updatedClosingStock,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Failed to delete sale.",
      ...(error.statusCode ? {} : { error: error.message }),
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
};