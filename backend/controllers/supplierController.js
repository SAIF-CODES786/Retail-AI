const Supplier = require("../models/Supplier");

// CREATE SUPPLIER
const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create supplier",
      error: error.message,
    });
  }
};

// GET ALL SUPPLIERS
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch suppliers",
      error: error.message,
    });
  }
};

// GET SINGLE SUPPLIER
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      supplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch supplier",
      error: error.message,
    });
  }
};

// UPDATE SUPPLIER
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update supplier",
      error: error.message,
    });
  }
};

// DELETE SUPPLIER
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};