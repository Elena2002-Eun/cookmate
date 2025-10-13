const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const auth = require("../middleware/auth");

// GET /api/favorites -> list favorites (populated)
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({ path: "favorites", select: "title tags difficulty" })
      .lean();

    if (!user) return res.status(401).json({ error: "User not found" });

    const favorites = Array.isArray(user.favorites) ? user.favorites : [];
    return res.json(favorites);
  } catch (err) {
    console.error("favorites GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/favorites/:id -> add a favorite
router.post("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid recipe id" });
    }
    const recipe = await Recipe.findById(id).lean();
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    user.favorites = Array.isArray(user.favorites) ? user.favorites : [];

    if (!user.favorites.some(rid => String(rid) === String(id))) {
      user.favorites.push(id);
      await user.save();
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("favorites POST error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/favorites/:id -> remove
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    user.favorites = Array.isArray(user.favorites) ? user.favorites : [];
    user.favorites = user.favorites.filter(rid => String(rid) !== String(id));
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("favorites DELETE error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;