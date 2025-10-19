const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();

// helper: escape user-provided strings for regex
function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/recipes/all?difficulty=easy&tag=vegetarian&page=1&pageSize=12
 * Returns list of recipes with optional filters.
 */
router.get('/all', async (req, res) => {
  try {
    const { difficulty, tag } = req.query;

    // pagination
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSizeRaw = parseInt(req.query.pageSize || '12', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50); // clamp 1..50
    const skip = (page - 1) * pageSize;

    const query = {};
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();

    // Case-insensitive exact tag match (so "Vegan" matches "vegan")
    if (tag) {
      const safe = escapeRegex(String(tag));
      query.tags = { $elemMatch: { $regex: new RegExp(`^${safe}$`, 'i') } };
    }

    const [items, total] = await Promise.all([
      // ✅ include imageUrl so the list can render thumbnails
      Recipe.find(query, { title: 1, tags: 1, difficulty: 1, imageUrl: 1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Recipe.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error('recipes/all error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/recipes/tags
 * Distinct list of tags (sorted).
 */
router.get('/tags', async (_req, res) => {
  try {
    const tags = await Recipe.distinct('tags');
    res.json(tags.sort());
  } catch (err) {
    console.error('tags route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/recipes/tag-counts
 * -> [{ tag: "vegetarian", count: 12 }, ...]
 */
router.get('/tag-counts', async (_req, res) => {
  try {
    const result = await Recipe.aggregate([
      // ensure tags is an array
      { $project: { tags: { $ifNull: ["$tags", []] } } },
      { $unwind: "$tags" },

      // coerce to lowercased trimmed strings; skip empties
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

/**
 * GET /api/recipes/:id
 * Full recipe (with steps, ingredients, imageUrl, etc.)
 */
router.get('/:id', async (req, res) => {
  const rec = await Recipe.findById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

module.exports = router;