require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes  = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const menuRoutes  = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

/**
 * CORS
 * - Allows localhost during dev
 * - Allows your Vercel URL in production via FRONTEND_ORIGIN
 * - Handles credentials (cookies) safely
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN, // e.g. https://client-smartfood.vercel.app
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g., Postman) or same-origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/", (_req, res) => res.send("🍽️ SmartFood API is running..."));

// 404
app.use((req, res) => res.status(404).json({ message: "🔍 Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// DB + start
mongoose
  .connect(process.env.MONGO_URI, {
    // (these options are harmless if using Mongoose v6+)
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
