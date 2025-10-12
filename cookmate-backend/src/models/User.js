const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  history: [{
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    viewedAt: { type: Date, default: Date.now }
  }],
  pantry: [String]  // <-- add this line
});

module.exports = mongoose.model("User", userSchema);