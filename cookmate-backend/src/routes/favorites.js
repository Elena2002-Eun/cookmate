const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Add recipe to favorites
router.post("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    await User.findByIdAndUpdate(req.userId, { $addToSet: { favorites: recipeId } });
    res.json({ msg: "Added to favorites" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all favorites
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("favorites");
    res.json(user.favorites);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove from favorites
router.delete("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    await User.findByIdAndUpdate(req.userId, { $pull: { favorites: recipeId } });
    res.json({ msg: "Removed from favorites" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;