const Outlet = require("../models/Outlet");

// CREATE OUTLET
const createOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.create(req.body);

    res.status(201).json({
      message: "Outlet created successfully",
      outlet,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create outlet",
      error: error.message,
    });
  }
};

// GET ALL OUTLETS
const getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: outlets.length,
      outlets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch outlets",
      error: error.message,
    });
  }
};

// GET OUTLET BY ID
const getOutletById = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        message: "Outlet not found",
      });
    }

    res.status(200).json({ outlet });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch outlet",
      error: error.message,
    });
  }
};

// UPDATE OUTLET
const updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!outlet) {
      return res.status(404).json({
        message: "Outlet not found",
      });
    }

    res.status(200).json({
      message: "Outlet updated successfully",
      outlet,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update outlet",
      error: error.message,
    });
  }
};

// DELETE OUTLET
const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findByIdAndDelete(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        message: "Outlet not found",
      });
    }

    res.status(200).json({
      message: "Outlet deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete outlet",
      error: error.message,
    });
  }
};

module.exports = {
  createOutlet,
  getOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
};