const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// GET saved pantry
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  res.json(user?.pantry || []);
});

// PUT replace pantry
router.put("/", auth, async (req, res) => {
  const list = Array.isArray(req.body.pantry) ? req.body.pantry : [];
  const normalized = [...new Set(list.map(s => String(s || "").trim().toLowerCase()).filter(Boolean))];
  const user = await User.findByIdAndUpdate(req.userId, { pantry: normalized }, { new: true });
  res.json(user.pantry);
});

// POST add one item
router.post("/", auth, async (req, res) => {
  const v = String(req.body.item || "").trim().toLowerCase();
  if (!v) return res.status(400).json({ error: "item required" });
  const user = await User.findById(req.userId);
  user.pantry = Array.from(new Set([...(user.pantry || []), v]));
  await user.save();
  res.json(user.pantry);
});

// DELETE remove one item
router.delete("/:item", auth, async (req, res) => {
  const v = String(req.params.item || "").trim().toLowerCase();
  const user = await User.findById(req.userId);
  user.pantry = (user.pantry || []).filter(x => x !== v);
  await user.save();
  res.json(user.pantry);
});

module.exports = router;