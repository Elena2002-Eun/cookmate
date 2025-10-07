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

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: [ingredientSchema],
  ingredientText: String, // for TF-IDF search
  steps: [stepSchema],
  prepTimeMin: Number,
  difficulty: String,
  tags: [String],
});

module.exports = mongoose.model('Recipe', recipeSchema);