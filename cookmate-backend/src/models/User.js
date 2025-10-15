const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],

    history: [
      {
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],

    // ✅ Pantry field (string array)
    pantry: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Ensure arrays are at least empty arrays before save
userSchema.pre("save", function (next) {
  if (!Array.isArray(this.favorites)) this.favorites = [];
  if (!Array.isArray(this.history)) this.history = [];
  if (!Array.isArray(this.pantry)) this.pantry = [];
  next();
});

module.exports = mongoose.model("User", userSchema);