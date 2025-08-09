// models/Vendor.js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
});

const vendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["user", "vendor", "admin"],
    default: "vendor",
  },
  menu: [menuItemSchema],
});

module.exports = mongoose.model("Vendor", vendorSchema);
