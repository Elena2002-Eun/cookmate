const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,

  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],

  history: [{
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    viewedAt: { type: Date, default: Date.now }
  }],

  pantry: [{ type: String }]
});

module.exports = mongoose.model("User", UserSchema);