const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem"); // ✅ needed to backfill vendorId

// CREATE
router.post("/", async (req, res) => {
  try {
    const { fullName, phone, address, deliveryType, items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item." });
    }

    // ✅ Ensure every item has vendorId (fallback via MenuItem lookup)
    const normalizedItems = await Promise.all(
      items.map(async (it) => {
        if (it.vendorId) {
          // already good
          return it;
        }

        // try to resolve from menu item in DB
        const lookupId = it.menuItemId || it._id; // we sent menuItemId from the client
        if (!lookupId) return it; // let schema validation handle if still missing

        const menu = await MenuItem.findById(lookupId).select("vendorId imageUrl name price");
        if (menu?.vendorId) {
          return {
            ...it,
            vendorId: menu.vendorId,
            imageUrl: it.imageUrl || menu.imageUrl,
            name: it.name || menu.name,
            price: it.price ?? menu.price,
            menuItemId: lookupId,
          };
        }
        return it;
      })
    );

    const order = new Order({
      fullName,
      phone,
      address,
      deliveryType,
      items: normalizedItems,
      total,
      status: "pending",
    });

    await order.save();
    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    console.warn("Order error:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

/**
 * READ ALL
 * Optional query filters:
 *   ?vendor=<vendorId>  -> only orders that include items for this vendor
 *   ?status=pending|accepted|delivered|cancelled
 */
router.get("/", async (req, res) => {
  try {
    const { vendor, status } = req.query;

    const find = {};
    if (status) find.status = status;
    if (vendor) find["items.vendorId"] = vendor;

    const orders = await Order.find(find).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// READ: vendor scoped (nice for VendorOrders.jsx)
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const orders = await Order.find({ "items.vendorId": vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch vendor orders error:", err);
    res.status(500).json({ message: "Failed to fetch vendor orders" });
  }
});

// (Optional) Update order status
router.patch("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // "pending" | "accepted" | "delivered" | "cancelled"
    const allowed = ["pending", "accepted", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

module.exports = router;
