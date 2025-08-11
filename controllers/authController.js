// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = "7d";

const signToken = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

exports.register = async (req, res) => {
  try {
    let { name, email, password, role = "user" } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    email = String(email).toLowerCase().trim();
    name = String(name).trim();

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(String(password), 10);

    await User.create({
      name,
      email,
      password: hashed,
      role, // "user" | "vendor" | "admin" (validated by schema enum)
    });

    // Frontend expects just a success message and then navigates to /login
    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET in environment");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = String(email).toLowerCase().trim();

    // password is select:false in the model — opt-in here
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.password || "");
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
};
