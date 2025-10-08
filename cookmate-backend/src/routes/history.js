const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const router = express.Router();

// record a view
router.post("/view/:recipeId", auth, async (req, res) => {
  const { recipeId } = req.params;
  await User.findByIdAndUpdate(
    req.userId,
    { $push: { history: { recipe: recipeId, at: new Date() } } },
    { new: true }
  );
  res.json({ msg: "view recorded" });
});

// list history (latest first)
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.userId).populate("history.recipe");
  const list = (user.history || []).sort((a,b)=> new Date(b.at) - new Date(a.at));
  res.json(list.slice(0, 50));
});

module.exports = router;