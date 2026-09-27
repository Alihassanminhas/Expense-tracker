const { pool } = require("../config/db");

// Model helper functions for raw SQL queries
const User = {
  // Find user by email
  findByEmail: async (email) => {
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  // Create new user
  create: async (name, email, password) => {
    const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const { rows } = await pool.query(query, [name, email, password]);
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const query = "SELECT id, name, email, created_at FROM users WHERE id = $1";
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

module.exports = User;