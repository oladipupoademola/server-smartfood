require("dotenv").config(); // load env once, at top

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes  = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const menuRoutes  = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// CORS
const allowedOrigin = "http://localhost:5173";
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// 🔎 Debug once if needed
// console.log("authRoutes typeof:", typeof authRoutes);
// console.log("vendorRoutes typeof:", typeof vendorRoutes);
// console.log("menuRoutes typeof:", typeof menuRoutes);
// console.log("orderRoutes typeof:", typeof orderRoutes);

// Routes (use the imported variables, don’t re-require inline)
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// Root
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
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
