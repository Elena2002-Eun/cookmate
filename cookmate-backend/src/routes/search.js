// cookmate-backend/src/routes/search.js
const express = require("express");
const { getTopMatches } = require("../recommender/tfidf");

const router = express.Router();

/**
 * POST /api/search/by-ingredients
 * Body: { pantry: string[], limit?: number }
 * Returns: [{ _id, title, imageUrl, score }]
 */
router.post("/by-ingredients", async (req, res) => {
  // sanitize inputs
  const pantryRaw = req.body?.pantry;
  const pantry = Array.isArray(pantryRaw)
    ? pantryRaw.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 50)
    : [];

  const limit = Math.min(Math.max(parseInt(req.body?.limit || "12", 10), 1), 50);

  try {
    // getTopMatches may return:
    //   A) [{ recipe, score }]
    //   B) [{ _id, title, imageUrl, score }]
    //   C) [recipeDoc, ...]  (rare; we normalize anyway)
    const matches = await getTopMatches(pantry, limit);

    const normalized = (matches || [])
      .map((m) => {
        let score = 0;
        let rec = m;

        // shape A
        if (m && typeof m === "object" && "score" in m) {
          score = Number(m.score || 0);
          rec = m.recipe || m;
        }

        // rec is now the recipe document-ish
        const id =
          (rec && rec._id && typeof rec._id.toString === "function"
            ? rec._id.toString()
            : rec?._id) || null;

        return id
          ? {
              _id: id,
              title: rec?.title || "",
              imageUrl: rec?.imageUrl || "",
              score,
            }
          : null;
      })
      .filter(Boolean);

    return res.json(normalized);
  } catch (err) {
    console.error("search/by-ingredients error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;