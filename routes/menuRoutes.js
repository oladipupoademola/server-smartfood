const express = require("express");
const router = express.Router();
const multer = require("multer");
const MenuItem = require("../models/MenuItem");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

// NOTE: ensure dotenv is called in server.js BEFORE this file is required
// require("dotenv").config();

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer (in‑memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|gif)/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "menu_items" },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

/**
 * GET /api/menu
 * Query params:
 *   - vendor=<vendorId>      filter by vendor
 *   - category=<category>    filter by category
 *   - search=<text>          fuzzy on name/category (case-insensitive)
 */
router.get("/", async (req, res) => {
  try {
    const { vendor, category, search } = req.query;
    const query = {};

    if (vendor) query.vendorId = vendor;
    if (category) query.category = category;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { category: regex }];
    }

    const items = await MenuItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Failed to fetch menu items:", err);
    res.status(500).json({ message: "Failed to fetch menu items" });
  }
});

/**
 * GET /api/menu/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  } catch (err) {
    console.error("Failed to fetch menu item:", err);
    res.status(500).json({ message: "Failed to fetch menu item" });
  }
});

/**
 * POST /api/menu
 * multipart/form-data: image (file), name, price, category, available, vendorId
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, available, vendorId } = req.body;

    if (!name || price == null || !category) {
      return res.status(400).json({ message: "Name, price, and category are required." });
    }
    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required." });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const newItem = new MenuItem({
      name,
      price: Number(price),
      category,
      available: String(available) === "true" || available === true || String(available) === "1",
      imageUrl,
      vendorId, // required
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    const msg =
      err?.message?.includes("Only image files are allowed")
        ? "Only image files are allowed (png, jpg, jpeg, webp, gif)."
        : "Server error while creating menu item";
    console.error("Error creating menu item:", err);
    res.status(500).json({ message: msg });
  }
});

/**
 * PUT /api/menu/:id
 * Accepts multipart/form-data so image can be replaced.
 * Send vendorId as well (keeps ownership intact).
 */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, available, vendorId } = req.body;
    const updatedData = {};

    if (name != null) updatedData.name = name;
    if (price != null) updatedData.price = Number(price);
    if (category != null) updatedData.category = category;
    if (available != null) {
      updatedData.available =
        String(available) === "true" || available === true || String(available) === "1";
    }
    if (vendorId) updatedData.vendorId = vendorId;

    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.buffer);
      updatedData.imageUrl = imageUrl;
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ message: "Menu item not found" });

    res.json(updated);
  } catch (err) {
    const msg =
      err?.message?.includes("Only image files are allowed")
        ? "Only image files are allowed (png, jpg, jpeg, webp, gif)."
        : "Failed to update item";
    console.error("Error updating menu item:", err);
    res.status(500).json({ message: msg });
  }
});

/**
 * DELETE /api/menu/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const exists = await MenuItem.findById(req.params.id);
    if (!exists) return res.status(404).json({ message: "Menu item not found" });

    await MenuItem.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.error("Failed to delete item:", err);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

module.exports = router;
