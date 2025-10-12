const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();

/**
 * GET /api/recipes/all?difficulty=easy&tag=vegetarian
 * Returns list of recipes with optional filters.
 */
router.get('/all', async (req, res) => {
  try {
    const { difficulty, tag } = req.query;
    const query = {};

    if (difficulty) {
      // normalize to lowercase
      query.difficulty = String(difficulty).toLowerCase();
    }
    if (tag) {
      // tags contains value
      query.tags = { $in: [String(tag).toLowerCase()] };
    }

    const recs = await Recipe.find(query, { title: 1, tags: 1, difficulty: 1 })
      .limit(100)
      .lean();

    res.json(recs);
  } catch (err) {
    console.error('recipes/all error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/:id  -> full recipe (with steps)
router.get('/:id', async (req, res) => {
  const rec = await Recipe.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

module.exports = router;