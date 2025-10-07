const express = require('express');
const { getTopMatches } = require('../recommender/tfidf');

const router = express.Router();

// POST /api/search/by-ingredients
router.post('/by-ingredients', async (req, res) => {
  const { pantry = [] } = req.body;
  try {
    const results = await getTopMatches(pantry, 5);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;