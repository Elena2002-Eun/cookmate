const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();

// GET /api/recipes/all  -> list some fields for all recipes (limit 100)
router.get('/all', async (_req, res) => {
  try {
    const recs = await Recipe.find({}, { title: 1, tags: 1, difficulty: 1 }).limit(100);
    res.json(recs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list recipes' });
  }
});

// GET /api/recipes/:id  -> full recipe (with steps, ingredients)
router.get('/:id', async (req, res) => {
  try {
    const rec = await Recipe.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    res.json(rec);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load recipe' });
  }
});

module.exports = router;