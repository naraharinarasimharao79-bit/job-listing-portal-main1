const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// GET endpoint info for register
router.get("/register", (req, res) => {
  res.json({
    message: "User Registration Endpoint",
    method: "POST",
    endpoint: "/api/auth/register",
    requiredFields: {
      email: "string (required, unique)",
      password: "string (required)",
      role: "string (optional: 'jobseeker' or 'employer', default: 'jobseeker')"
    },
    example: {
      email: "john@example.com",
      password: "password123",
      role: "jobseeker"
    },
    response: {
      success: { msg: "User registered successfully" },
      error: { msg: "User already exists" }
    }
  });
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name || email.split("@")[0], // Use email prefix if name not provided
      email,
      password: hashedPassword,
      role: role || "jobseeker"
    });

    await user.save();
    res.json({ msg: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET endpoint info for login
router.get("/login", (req, res) => {
  res.json({
    message: "User Login Endpoint",
    method: "POST",
    endpoint: "/api/auth/login",
    requiredFields: {
      email: "string (required)",
      password: "string (required)"
    },
    example: {
      email: "john@example.com",
      password: "password123"
    },
    response: {
      success: {
        token: "JWT token",
        name: "User name",
        email: "User email",
        role: "User role (jobseeker/employer/admin)"
      },
      error: { msg: "Invalid credentials" }
    }
  });
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
