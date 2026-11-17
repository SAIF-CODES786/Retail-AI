const Expense = require("../models/Expense");

// CREATE EXPENSE
const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);

    res.status(201).json({
      message: "Expense recorded successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to record expense",
      error: error.message,
    });
  }
};

// GET ALL EXPENSES
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    res.status(200).json({
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// GET SINGLE EXPENSE
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json({ expense });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

// UPDATE EXPENSE
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

// DELETE EXPENSE
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};