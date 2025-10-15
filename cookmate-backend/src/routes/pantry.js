const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// GET current pantry
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    return res.json(user?.pantry || []);
  } catch (e) {
    console.error("GET /api/pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT replace entire pantry: { pantry: string[] }
router.put("/", auth, async (req, res) => {
  try {
    const body = req.body || {};
    const list = Array.isArray(body.pantry)
      ? body.pantry.map((s) => String(s || "").trim()).filter(Boolean)
      : null;

    if (!list) {
      return res.status(400).json({ error: "Invalid body. Expect { pantry: string[] }" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { pantry: list } },
      { new: true }
    ).lean();

    return res.json(user?.pantry || []);
  } catch (e) {
    console.error("PUT /api/pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST add single item: { item: string }
router.post("/", auth, async (req, res) => {
  try {
    const item = String(req.body?.item || "").trim();
    if (!item) return res.status(400).json({ error: "Empty item" });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { pantry: item } },
      { new: true }
    ).lean();

    return res.json(user?.pantry || []);
  } catch (e) {
    console.error("POST /api/pantry error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE single item by label
router.delete("/:label", auth, async (req, res) => {
  try {
    const label = decodeURIComponent(req.params.label || "");
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { pantry: label } },
      { new: true }
    ).lean();

    return res.json(user?.pantry || []);
  } catch (e) {
    console.error("DELETE /api/pantry/:label error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;