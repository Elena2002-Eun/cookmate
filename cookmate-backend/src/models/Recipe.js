// cookmate-backend/src/models/Recipe.js
const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  order: { type: Number, default: 0 },
  text: { type: String, default: "" },
  durationSec: { type: Number, default: 0 },
}, { _id: false });

const ingredientSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  quantity: { type: String, default: "" },
}, { _id: false });

const ratingSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    value: { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false, timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    // Core
    title: { type: String, required: true },
    ingredients: { type: [ingredientSchema], default: [] },
    ingredientText: { type: String, default: "" }, // for TF-IDF / search
    steps: { type: [stepSchema], default: [] },
    prepTimeMin: { type: Number, default: 0 },

    // Facets / filters
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      index: true,
    },
    tags: { type: [String], default: [] },

    // Media
    imageUrl: { type: String, default: "" },

    // ⭐ Ratings
    ratings: { type: [ratingSchema], default: [] },

    // Cached summary for fast list pages
    avgRating:    { type: Number, default: 0 }, // 0..5 (1 decimal stored)
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Helper: recompute cached rating fields from ratings[]
recipeSchema.methods.recomputeRatingCache = function recomputeRatingCache() {
  const count = this.ratings.length;
  const avg = count ? this.ratings.reduce((s, r) => s + r.value, 0) / count : 0;
  this.avgRating = Math.round(avg * 10) / 10; // keep 1 decimal
  this.ratingsCount = count;
};

// Helpful index if you later query by user rating
recipeSchema.index({ 'ratings.user': 1 });

module.exports = mongoose.model('Recipe', recipeSchema);