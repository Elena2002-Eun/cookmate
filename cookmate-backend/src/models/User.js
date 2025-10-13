const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  history: [{
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    viewedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Make sure arrays are at least empty arrays
userSchema.pre("save", function(next) {
  if (!Array.isArray(this.favorites)) this.favorites = [];
  if (!Array.isArray(this.history)) this.history = [];
  next();
});

module.exports = mongoose.model("User", userSchema);