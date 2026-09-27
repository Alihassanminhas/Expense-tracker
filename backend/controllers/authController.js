const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const registerUser = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide your name, email, and password." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUser = await User.create(name, email, hashedPassword);
    const token = generateToken(createdUser.id);

    return res.status(201).json({
      success: true,
      user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, token },
    });
  } catch (error) {
    console.error("Register User Error:", error.message);
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    return res.status(500).json({ success: false, message: "Failed to create your account." });
  }
};

const loginUser = async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide your email and password." });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user.id);
    return res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, token },
    });
  } catch (error) {
    console.error("Login User Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to log in." });
  }
};

// MUST BE EXPORTED AS AN OBJECT
module.exports = {
  registerUser,
  loginUser,
};
