// models/MenuItem.js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },

    // ✅ NEW: link each item to its vendor
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  },
  { timestamps: true }
);

// (optional) index for faster vendor queries
menuItemSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
