// cookmate-backend/src/routes/recipes.js
const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();

// helper: escape user-provided strings for regex
function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// auth guard
function requireAuth(req, res, next) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Auth required' });
  }
  next();
}

/**
 * GET /api/recipes/all?difficulty=easy&tag=vegetarian&page=1&pageSize=12
 * Returns list of recipes with optional filters.
 */
// GET /api/recipes/all?difficulty=&tag=&page=&pageSize=&maxTime=&diet=
router.get('/all', async (req, res) => {
  try {
    const { difficulty, tag, maxTime, diet } = req.query;

    // pagination...
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSizeRaw = parseInt(req.query.pageSize || '12', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50);
    const skip = (page - 1) * pageSize;

    const query = {};
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();

    // existing tag (case-insensitive exact)
    if (tag) {
      const safe = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.tags = { $elemMatch: { $regex: new RegExp(`^${safe}$`, 'i') } };
    }

    // NEW: diet is just another tag constraint (e.g., "vegan")
    if (diet) {
      const safe = String(diet).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.tags = query.tags
        ? { $all: [ query.tags, { $elemMatch: { $regex: new RegExp(`^${safe}$`, 'i') } } ] } // both tag and diet
        : { $elemMatch: { $regex: new RegExp(`^${safe}$`, 'i') } };
    }

    // NEW: max time (prepTimeMin <= maxTime)
    const mt = Number(maxTime);
    if (Number.isFinite(mt) && mt > 0) {
      query.prepTimeMin = { $lte: mt };
    }

    const [items, total] = await Promise.all([
      Recipe.find(query, { title: 1, tags: 1, difficulty: 1, imageUrl: 1, avgRating: 1, ratingsCount: 1, prepTimeMin: 1 })
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
      { $project: { tags: { $ifNull: ["$tags", []] } } },
      { $unwind: "$tags" },
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
 * POST /api/recipes/:id/rate  { value: 1..5 }
 * Allows authenticated user to rate a recipe.
 */
router.post('/:id/rate', requireAuth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { value } = req.body || {};
    const rating = Number(value);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'value must be 1..5' });
    }

    const rec = await Recipe.findById(recipeId);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    // upsert rating for this user
    const uid = String(req.user._id);
    const idx = rec.ratings.findIndex(r => String(r.user) === uid);
    if (idx >= 0) {
      rec.ratings[idx].value = rating;
      rec.ratings[idx].updatedAt = new Date();
    } else {
      rec.ratings.push({ user: req.user._id, value: rating });
    }

    // update cached fields
    rec.recomputeRatingCache();
    await rec.save();

    return res.json({
      ok: true,
      avgRating: rec.avgRating,
      ratingsCount: rec.ratingsCount,
      myRating: rating,
    });
  } catch (err) {
    console.error('rate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/recipes/:id/ratings
 * Returns average rating, total count, and current user's rating (if logged in)
 */
router.get('/:id/ratings', async (req, res) => {
  try {
    const rec = await Recipe.findById(req.params.id).select(
      'avgRating ratingsCount ratings.user ratings.value'
    );
    if (!rec) return res.status(404).json({ error: 'Not found' });

    let myRating = 0;
    if (req.user && req.user._id) {
      const r = rec.ratings.find(x => String(x.user) === String(req.user._id));
      myRating = r ? r.value : 0;
    }

    res.json({
      avgRating: rec.avgRating,
      ratingsCount: rec.ratingsCount,
      myRating,
    });
  } catch (err) {
    console.error('ratings get error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/recipes/:id
 * Full recipe (excluding detailed ratings array)
 */
router.get('/:id', async (req, res) => {
  const rec = await Recipe.findById(req.params.id).select('-ratings');
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

module.exports = router;