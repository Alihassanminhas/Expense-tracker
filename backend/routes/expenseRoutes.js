const express = require("express");
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

// Protect all expense routes with JWT middleware
router.use(protect);

router.route("/")
  .get(getExpenses)
  .post(createExpense);

router.get("/summary", getExpenseSummary);

router.route("/:id")
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;