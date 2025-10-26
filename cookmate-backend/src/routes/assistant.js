// cookmate-backend/src/routes/assistant.js
const express = require("express");
const Recipe = require("../models/Recipe");

const router = express.Router();

/** ---------------- Intent extraction (simple & robust) ---------------- */
function extractIntent(message = "") {
  const m = String(message || "").toLowerCase();

  const diets = [];
  if (/\bvegan\b/.test(m)) diets.push("vegan");
  if (/\bvegetarian\b/.test(m)) diets.push("vegetarian");
  if (/\bpescatarian\b/.test(m)) diets.push("pescatarian");
  if (/\bketo\b/.test(m)) diets.push("keto");
  if (/\bhalal\b/.test(m)) diets.push("halal");
  if (/\bkosher\b/.test(m)) diets.push("kosher");

  const allergens = [];
  if (/\b(gluten|celiac|coeliac)\b/.test(m)) allergens.push("gluten");
  if (/\b(dairy|lactose)\b/.test(m)) allergens.push("dairy");
  if (/\bnut|peanut|almond|walnut|cashew|hazelnut|pistachio\b/.test(m)) allergens.push("nuts");
  if (/\begg\b/.test(m)) allergens.push("egg");
  if (/\bsoy\b/.test(m)) allergens.push("soy");
  if (/\bshellfish|shrimp|prawn|lobster|crab|clam|mussel|oyster\b/.test(m)) allergens.push("shellfish");

  // free-form keywords (e.g., “dinner”, “soup”, “quick”)
  const keywords = Array.from(
    new Set(
      m
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) =>
          ![
            "my","mom","is","to","the","a","an","and","or","any","please","can","she","what","for",
            "with","without","could","you","me","make","eat","something","some","ideas","idea",
          ].includes(w)
        )
    )
  );

  return { diets, allergens, keywords };
}

/** ---------------- Tag mappings (what your DB likely uses) ---------------- */
const DIET_TAGS = {
  vegan: [/^vegan$/i],
  vegetarian: [/^vegetarian$/i],
  pescatarian: [/^pescatarian$/i],
  keto: [/^keto$/i],
  halal: [/^halal$/i],
  kosher: [/^kosher$/i],
};

const ALLERGENS_PREF_TAGS = {
  gluten: [/^gluten[-\s]?free$/i],
  dairy: [/^dairy[-\s]?free$/i, /^lactose[-\s]?free$/i],
  nuts: [/^nut[-\s]?free$/i, /^peanut[-\s]?free$/i],
  egg: [/^egg[-\s]?free$/i],
  soy: [/^soy[-\s]?free$/i],
  shellfish: [/^shell[-\s]?fish[-\s]?free$/i, /^shellfish[-\s]?free$/i],
};

/** ---------------- Ingredient exclusion (fallback) ---------------- */
const ALLERGENS_EXCLUDE_ING_WORDS = {
  gluten: [
    /\bwheat\b/i, /\bbarley\b/i, /\brye\b/i, /\bspelt\b/i, /\beinkorn\b/i, /\bkamut\b/i,
    /\b(flour|all[-\s]?purpose\s+flour)\b/i, /\bpasta\b/i, /\bbread\b/i, /\bbreadcrumbs?\b/i,
    /\bpanko\b/i, /\bsemolina\b/i, /\bfarina\b/i, /\bcouscous\b/i, /\bmalt\b/i, /\bseitan\b/i,
    /\bsoy sauce\b/i, // often not GF unless specified
  ],
  dairy: [/\bmilk\b/i, /\bbutter\b/i, /\bcheese\b/i, /\bcream\b/i, /\byogurt\b/i, /\bwhey\b/i, /\bghee\b/i],
  nuts: [/\balmond\b/i, /\bwalnut\b/i, /\bcashew\b/i, /\bpecan\b/i, /\bhazelnut\b/i, /\bpistachio\b/i, /\bpeanut\b/i, /\bmacadamia\b/i, /\bpine nut\b/i],
  egg: [/\begg\b/i, /\beggs\b/i, /\bmayonnaise\b/i, /\baioli\b/i],
  soy: [/\bsoy\b/i, /\bsoybean\b/i, /\btofu\b/i, /\btempeh\b/i, /\bedamame\b/i, /\bsoy sauce\b/i, /\bmiso\b/i],
  shellfish: [/\bshrimp\b/i, /\bprawn\b/i, /\blobster\b/i, /\bcrab\b/i, /\bclam\b/i, /\bmussel\b/i, /\boyster\b/i, /\bscallop\b/i],
};

function hasIngredientField(doc) {
  return Array.isArray(doc.ingredients);
}

/** ---------------- Build queries ---------------- */
function buildQueries(intent) {
  const { diets, allergens, keywords } = intent;

  // 1) preferred: tag-based
  const tagRegexes = [];
  diets.forEach((d) => (DIET_TAGS[d] || []).forEach((re) => tagRegexes.push(re)));
  allergens.forEach((a) => (ALLERGENS_PREF_TAGS[a] || []).forEach((re) => tagRegexes.push(re)));

  const tagsClause = tagRegexes.length
    ? { tags: { $elemMatch: { $in: tagRegexes } } }
    : {};

  // 2) keyword fallback (title/tags)
  const kwRegexes = (keywords || [])
    .filter((w) => w.length >= 3)
    .slice(0, 6)
    .map((w) => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  const orKw = kwRegexes.length
    ? [{ title: { $in: kwRegexes } }, { tags: { $elemMatch: { $in: kwRegexes } } }]
    : [];

  const strongQuery = Object.keys(tagsClause).length
    ? { ...tagsClause }
    : orKw.length
    ? { $or: orKw }
    : {};

  const weakQuery = orKw.length ? { $or: orKw } : {};

  return { strongQuery, weakQuery, allergens, tagRegexes };
}

function filterOutAllergensInMemory(items, allergens) {
  if (!allergens?.length) return items;

  const checks = [];
  allergens.forEach((a) => (ALLERGENS_EXCLUDE_ING_WORDS[a] || []).forEach((re) => checks.push(re)));
  if (!checks.length) return items;

  return items.filter((doc) => {
    if (!hasIngredientField(doc)) return true;
    return !doc.ingredients.some((ing) => {
      const text = typeof ing === "string"
        ? ing
        : [ing?.name, ing?.quantity].filter(Boolean).join(" ");
      return checks.some((re) => re.test(String(text || "")));
    });
  });
}

function toCard(r) {
  return {
    _id: r._id,
    title: r.title,
    imageUrl: r.imageUrl || "",
    difficulty: r.difficulty || "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    prepTimeMin: r.prepTimeMin || 0,
  };
}

/** ---------------- Route: POST /api/assistant ---------------- */
router.post("/", async (req, res) => {
  try {
    const msg = String(req.body?.message || "");
    if (!msg.trim()) return res.status(400).json({ error: "message required" });

    const intent = extractIntent(msg);
    const { strongQuery, weakQuery, allergens } = buildQueries(intent);

    // 1) try strong query first
    let items = await Recipe.find(strongQuery)
      .select("_id title imageUrl difficulty tags prepTimeMin ingredients")
      .sort({ _id: -1 })
      .limit(60)
      .lean();

    // 2) fallback to weak query
    if (!items.length && Object.keys(weakQuery).length) {
      items = await Recipe.find(weakQuery)
        .select("_id title imageUrl difficulty tags prepTimeMin ingredients")
        .sort({ _id: -1 })
        .limit(60)
        .lean();
    }

    // 3) last resort: recent
    if (!items.length) {
      items = await Recipe.find({})
        .select("_id title imageUrl difficulty tags prepTimeMin ingredients")
        .sort({ _id: -1 })
        .limit(40)
        .lean();
    }

    // 4) in-memory allergen exclusion (best-effort)
    const safe = filterOutAllergensInMemory(items, allergens).slice(0, 12);

    if (!safe.length) {
      return res.json({
        intent,
        reply:
          "I couldn’t find exact matches with your constraints. Here are some recent recipes you might adapt.",
        suggestions: items.slice(0, 8).map(toCard),
      });
    }

    const parts = [];
    if (intent.allergens.length) parts.push(`avoiding: ${intent.allergens.join(", ")}`);
    if (intent.diets.length) parts.push(`diet: ${intent.diets.join(", ")}`);
    const reply = parts.length ? `Okay — ${parts.join(" • ")}. Here are some ideas:` : "Here are a few ideas:";

    return res.json({
      intent,
      reply,
      suggestions: safe.map(toCard),
    });
  } catch (e) {
    console.error("assistant error:", e);
    return res.status(500).json({
      reply: "Sorry — I had trouble finding recipes.",
      suggestions: [],
    });
  }
});

/** Probe to confirm mounting */
router.get("/_probe", (_req, res) => res.json({ ok: true, who: "assistant-router" }));

module.exports = router;