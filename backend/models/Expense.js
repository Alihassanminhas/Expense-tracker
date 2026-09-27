const { pool } = require("../config/db");

const Expense = {
  /**
   * Create a new expense entry
   */
  create: async ({ userId, categoryId, title, amount, description, expenseDate }) => {
    const query = `
      INSERT INTO expenses (user_id, category_id, title, amount, description, expense_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      userId,
      categoryId || null,
      title,
      amount,
      description || null,
      expenseDate || new Date(),
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  /**
   * Get all expenses for a specific user (with category details joined)
   */
  findAllByUserId: async (userId) => {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.amount,
        e.description,
        e.expense_date,
        e.created_at,
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = $1
      ORDER BY e.expense_date DESC, e.created_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  /**
   * Get a single expense by ID belonging to a specific user
   */
  findById: async (id, userId) => {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.amount,
        e.description,
        e.expense_date,
        e.created_at,
        c.id AS category_id,
        c.name AS category_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1 AND e.user_id = $2;
    `;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
  },

  /**
   * Update an existing expense entry
   */
  update: async (id, userId, { categoryId, title, amount, description, expenseDate }) => {
    const query = `
      UPDATE expenses
      SET 
        category_id = COALESCE($1, category_id),
        title = COALESCE($2, title),
        amount = COALESCE($3, amount),
        description = COALESCE($4, description),
        expense_date = COALESCE($5, expense_date)
      WHERE id = $6 AND user_id = $7
      RETURNING *;
    `;
    const values = [categoryId, title, amount, description, expenseDate, id, userId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  /**
   * Delete an expense entry
   */
  delete: async (id, userId) => {
    const query = `
      DELETE FROM expenses
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
  },

  /**
   * Get user spending totals and current-month income.
   */
  getSummary: async (userId) => {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN category_id IS DISTINCT FROM 6 THEN amount ELSE 0 END), 0) AS total_spending,
        COALESCE(SUM(CASE WHEN category_id IS DISTINCT FROM 6 AND expense_date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS monthly_spending,
        COALESCE(SUM(CASE WHEN category_id IS DISTINCT FROM 6 AND expense_date >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS weekly_spending,
        COALESCE(SUM(CASE WHEN category_id = 6 AND expense_date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS monthly_income
      FROM expenses
      WHERE user_id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  },
};

module.exports = Expense;
