const natural = require('natural');
const Recipe = require('../models/Recipe');

// TF-IDF based ingredient matcher
async function getTopMatches(pantry = [], topN = 5) {
  // fetch all recipes
  const recipes = await Recipe.find({}, { ingredientText: 1, title: 1, _id: 1 });

  const tfidf = new natural.TfIdf();
  recipes.forEach(r => tfidf.addDocument((r.ingredientText || '').toLowerCase()));

  // query string = all pantry ingredients joined
  const query = pantry.join(' ').toLowerCase();

  // compute scores
  const scores = [];
  tfidf.tfidfs(query, (i, score) => {
    scores.push({ recipe: recipes[i], score });
  });

  // sort high → low
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topN);
}

module.exports = { getTopMatches };