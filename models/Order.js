// models/Order.js
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    imageUrl: { type: String },
    // Needed so vendors can see orders that include their items
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    // Optional linkage back to the menu item
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    deliveryType: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Order", OrderSchema);
