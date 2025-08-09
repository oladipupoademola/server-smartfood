const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");

// @route   GET /api/vendors
// @desc    Get all vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/vendor/menu
// @desc    Add menu item to a vendor
router.post("/menu", async (req, res) => {
  const { vendorId, name, description, price, image } = req.body;

  if (!vendorId || !name || !price) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found or not authorized" });
    }

    const newItem = {
      name,
      description: description || "",
      price,
      image: image || "",
    };

    vendor.menu.push(newItem);
    await vendor.save();

    res.status(201).json({ message: "Menu item added successfully", menu: vendor.menu });
  } catch (err) {
    console.error("Error adding menu item:", err);
    res.status(500).json({ message: "Server error uploading menu item" });
  }
});

module.exports = router;
