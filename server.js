require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// If behind a proxy (Render/Heroku), keep secure cookies/HTTPS flags accurate
app.set("trust proxy", 1);

// ----- CORS -----
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_ORIGIN, // e.g. https://client-smartfood.vercel.app
].filter(Boolean);

// In dev: be permissive (reflect origin) to avoid preflight issues.
// In prod: allow only known origins.
const corsOptions = isDev
  ? { origin: true, credentials: true, optionsSuccessStatus: 204 }
  : {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // Postman/cURL
        cb(null, allowedOrigins.includes(origin));
      },
      credentials: true,
      optionsSuccessStatus: 204,
    };

app.use(cors(corsOptions)); // handles preflights too
// Do NOT add app.options("*", ...) with path-to-regexp v6

// ----- Middleware -----
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// ----- Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// ----- Health -----
app.get("/", (_req, res) => res.send("🍽️ SmartFood API is running..."));

// ----- 404 -----
app.use((req, res) => res.status(404).json({ message: "🔍 Route not found" }));

// ----- Global error handler -----
app.use((err, req, res, _next) => {
  console.error("💥 Server Error:", err.stack || err);
  res.status(500).json({ message: "Something went wrong!" });
});

// ----- DB + start -----
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
