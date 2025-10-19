// cookmate-backend/src/models/Recipe.js
const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  order: Number,
  text: String,
  durationSec: Number,
});

const ingredientSchema = new mongoose.Schema({
  name: String,
  quantity: String,
});

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ingredients: [ingredientSchema],
    ingredientText: String, // for TF-IDF search
    steps: [stepSchema],
    prepTimeMin: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    tags: { type: [String], default: [] },
    imageUrl: { type: String, default: "" }, // ✅ added for thumbnails
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);