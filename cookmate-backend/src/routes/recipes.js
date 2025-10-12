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

router.get('/tags', async (_req, res) => {
  try {
    const tags = await Recipe.distinct('tags');
    res.json(tags.sort());
  } catch (err) {
    console.error('tags route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/tag-counts  -> [{ tag: "vegetarian", count: 12 }, ...]
router.get('/tag-counts', async (_req, res) => {
  try {
    const result = await Recipe.aggregate([
      // make sure tags exists and is an array
      { $project: { tags: { $ifNull: ["$tags", []] } } },
      { $unwind: "$tags" },

      // coerce any non-strings; trim; lower-case; skip empties
      {
        $project: {
          tag: {
            $toLower: {
              $trim: {
                input: {
                  $cond: [
                    { $eq: [{ $type: "$tags" }, "string"] },
                    "$tags",
                    { $toString: "$tags" }
                  ]
                }
              }
            }
          }
        }
      },
      { $match: { tag: { $ne: "" } } },

      // group and count
      { $group: { _id: "$tag", count: { $sum: 1 } } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
      { $sort: { tag: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('tag-counts route error:', err);
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