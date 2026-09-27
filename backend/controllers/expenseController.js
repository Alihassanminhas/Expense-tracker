const Expense = require("../models/Expense");

/**
 * Create a new expense
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
  const { categoryId, title, amount, description, expenseDate } = req.body;

  if (!title || !amount) {
    return res.status(400).json({
      success: false,
      message: "Please provide a title and amount.",
    });
  }

  try {
    const expense = await Expense.create({
      userId: req.user.id,
      categoryId,
      title,
      amount,
      description,
      expenseDate,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create expense.",
    });
  }
};

/**
 * Get all expenses for logged-in user
 * GET /api/expenses
 */
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAllByUserId(req.user.id);
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve expenses.",
    });
  }
};

/**
 * Get dashboard spending totals and monthly income.
 * GET /api/expenses/summary
 */
const getExpenseSummary = async (req, res) => {
  try {
    const summary = await Expense.getSummary(req.user.id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Summary Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load summary analytics.",
    });
  }
};

/**
 * Update an expense
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await Expense.findById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or unauthorized.",
      });
    }

    const updatedExpense = await Expense.update(id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update expense.",
    });
  }
};

/**
 * Delete an expense
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Expense.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense.",
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
};
