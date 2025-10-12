const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const auth = require("../middleware/auth");

// POST /api/history/:recipeId  -> add/refresh a view entry
router.post("/:recipeId", auth, async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe id" });
    }

    const recipe = await Recipe.findById(recipeId).lean();
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    user.history = user.history || [];
    // remove existing entry for this recipe
    user.history = user.history.filter(h => String(h.recipe) !== String(recipeId));
    // add newest at front
    user.history.unshift({ recipe: recipeId, viewedAt: new Date() });
    // cap list
    if (user.history.length > 100) user.history = user.history.slice(0, 100);

    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error("history POST error:", err.stack || err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/history  -> latest 50
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({ path: "history.recipe", select: "title tags difficulty" })
      .lean();

    if (!user) return res.status(401).json({ error: "User not found" });

    const items = (user.history || [])
      .slice(0, 50)
      .map(h => ({
        id: h.recipe?._id,
        title: h.recipe?.title || "(deleted)",
        tags: h.recipe?.tags || [],
        difficulty: h.recipe?.difficulty || "",
        viewedAt: h.viewedAt
      }));

    return res.json(items);
  } catch (err) {
    console.error("history GET error:", err.stack || err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;