// cookmate-backend/src/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");

const router = express.Router();

/* ───────────────── helpers ───────────────── */
function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Inline auth guard (used for rating)
function requireAuth(req, res, next) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: "Auth required" });
  }
  next();
}

/* ───────────────── probes / quick checks ───────────────── */
// GET /api/recipes/_probe → confirm router mounted
router.get("/_probe", (_req, res) => res.json({ ok: true, who: "recipes-router" }));

/* ───────────────── list endpoints ───────────────── */
/**
 * Simple list (minimal filters via `query` param)
 * GET /api/recipes?query=&page=1&pageSize=10
 * → { items, total, page, pageSize }
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize, 10) || 10));
    const q = (req.query.query || "").trim();
    const filter = q ? { title: new RegExp(q, "i") } : {};

    const total = await Recipe.countDocuments(filter);
    const items = await Recipe.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("_id title imageUrl difficulty tags prepTimeMin");

    res.json({ items, total, page, pageSize });
  } catch (err) {
    console.error("GET /api/recipes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Advanced list with filters
 * GET /api/recipes/all?difficulty=easy&tag=vegetarian&diet=vegan&maxTime=30&page=1&pageSize=12
 * → { items, total, page, pageSize, totalPages }
 */
router.get("/all", async (req, res) => {
  try {
    const { difficulty, tag, maxTime, diet } = req.query;

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSizeRaw = parseInt(req.query.pageSize || "12", 10);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50);
    const skip = (page - 1) * pageSize;

    const query = {};
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();

    // Tag match (case-insensitive exact)
    if (tag) {
      const safe = escapeRegex(String(tag).trim());
      query.tags = { $elemMatch: { $regex: new RegExp(`^${safe}$`, "i") } };
    }

    // Diet acts like an additional tag constraint
    if (diet) {
      const safe = escapeRegex(String(diet).trim());
      const dietExpr = { $elemMatch: { $regex: new RegExp(`^${safe}$`, "i") } };
      query.tags = query.tags ? { $all: [query.tags, dietExpr] } : dietExpr;
    }

    // Max prep time (minutes)
    const mt = Number(maxTime);
    if (Number.isFinite(mt) && mt > 0) {
      query.prepTimeMin = { $lte: mt };
    }

    const [items, total] = await Promise.all([
      Recipe.find(query, {
        title: 1,
        tags: 1,
        difficulty: 1,
        imageUrl: 1,
        avgRating: 1,
        ratingsCount: 1,
        prepTimeMin: 1,
      })
        .sort({ _id: -1 })
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
    console.error("recipes/all error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ───────────────── tag utilities ───────────────── */
/**
 * GET /api/recipes/tags
 * → distinct list of tags (sorted)
 */
router.get("/tags", async (_req, res) => {
  try {
    const tags = await Recipe.distinct("tags");
    res.json(tags.sort());
  } catch (err) {
    console.error("tags route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/recipes/tag-counts
 * → [{ tag: "vegetarian", count: 12 }, ...]
 */
router.get("/tag-counts", async (_req, res) => {
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
                    { $toString: "$tags" },
                  ],
                },
              },
            },
          },
        },
      },
      { $match: { tag: { $ne: "" } } },
      { $group: { _id: "$tag", count: { $sum: 1 } } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
      { $sort: { tag: 1 } },
    ]);
    res.json(result);
  } catch (err) {
    console.error("tag-counts route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ───────────────── ratings ───────────────── */
/**
 * POST /api/recipes/:id/rate  { value: 1..5 }
 * → { ok, avgRating, ratingsCount, myRating }
 */
router.post("/:id/rate", requireAuth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { value } = req.body || {};
    const rating = Number(value);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "value must be 1..5" });
    }

    const rec = await Recipe.findById(recipeId);
    if (!rec) return res.status(404).json({ error: "Not found" });

    const uid = String(req.user._id);
    const idx = rec.ratings.findIndex((r) => String(r.user) === uid);
    if (idx >= 0) {
      rec.ratings[idx].value = rating;
      rec.ratings[idx].updatedAt = new Date();
    } else {
      rec.ratings.push({ user: req.user._id, value: rating });
    }

    // Cached aggregate fields
    rec.recomputeRatingCache();
    await rec.save();

    res.json({
      ok: true,
      avgRating: rec.avgRating,
      ratingsCount: rec.ratingsCount,
      myRating: rating,
    });
  } catch (err) {
    console.error("rate error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/recipes/:id/ratings
 * → { avgRating, ratingsCount, myRating }
 */
router.get("/:id/ratings", async (req, res) => {
  try {
    const rec = await Recipe.findById(req.params.id).select(
      "avgRating ratingsCount ratings.user ratings.value"
    );
    if (!rec) return res.status(404).json({ error: "Not found" });

    let myRating = 0;
    if (req.user && req.user._id) {
      const r = rec.ratings.find((x) => String(x.user) === String(req.user._id));
      myRating = r ? r.value : 0;
    }

    res.json({
      avgRating: rec.avgRating,
      ratingsCount: rec.ratingsCount,
      myRating,
    });
  } catch (err) {
    console.error("ratings get error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ───────────────── detail ───────────────── */
/**
 * GET /api/recipes/:id
 * Full recipe (excluding ratings array to keep payload small)
 */
router.get("/:id", async (req, res) => {
  try {
    const rec = await Recipe.findById(req.params.id).select("-ratings");
    if (!rec) return res.status(404).json({ error: "Not found" });
    res.json(rec);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

module.exports = router;