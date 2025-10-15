// src/routes/pantry.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET current pantry
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("pantry");
    return res.json(Array.isArray(user?.pantry) ? user.pantry : []);
  } catch (e) {
    console.error("GET /pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT replace entire pantry
router.put("/", auth, async (req, res) => {
  try {
    const list = Array.isArray(req.body.pantry)
      ? req.body.pantry.map(s => String(s || "").trim()).filter(Boolean)
      : [];

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { pantry: list } },
      { new: true, runValidators: true, projection: { pantry: 1 } }
    );

    // If user not found, return empty array to keep client simple
    return res.json(Array.isArray(user?.pantry) ? user.pantry : []);
  } catch (e) {
    console.error("PUT /pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST add one item (deduped)
router.post("/", auth, async (req, res) => {
  try {
    const item = String(req.body.item || "").trim();
    if (!item) return res.status(400).json({ error: "Missing item" });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { pantry: item } },
      { new: true, projection: { pantry: 1 } }
    );

    return res.json(Array.isArray(user?.pantry) ? user.pantry : []);
  } catch (e) {
    console.error("POST /pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE remove one item
router.delete("/:item", auth, async (req, res) => {
  try {
    const it = decodeURIComponent(req.params.item || "");
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { pantry: it } },
      { new: true, projection: { pantry: 1 } }
    );

    return res.json(Array.isArray(user?.pantry) ? user.pantry : []);
  } catch (e) {
    console.error("DELETE /pantry/:item error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;