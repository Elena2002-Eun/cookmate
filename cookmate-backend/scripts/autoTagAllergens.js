 // scripts/autoTagAllergens.js
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Adjust if your model path differs
const Recipe = require("../src/models/Recipe");

/** ---------------- Configurable dictionaries ---------------- **/
const ALLERGENS = {
  gluten: {
    tag: "gluten-free",
    // Words that indicate gluten is present
    disallow: [
      /\bwheat\b/i, /\bbarley\b/i, /\brye\b/i, /\bspelt\b/i, /\bsemolina\b/i,
      /\bfarro\b/i, /\bcouscous\b/i, /\bpasta\b/i, /\bbreadcrumbs?\b/i,
      /\bflour\b/i, /\bbread\b/i, /\bgraham\b/i
    ],
    // If these appear (e.g., “gluten-free flour”), we’ll allow tagging even if "flour" appears
    allowIfAlsoHas: [/\bgluten[-\s]?free\b/i, /\bgf\b/i],
  },
  dairy: {
    tag: "dairy-free",
    disallow: [
      /\bmilk\b/i, /\bbutter\b/i, /\bcheese\b/i, /\bcream\b/i, /\byogurt\b/i, /\bghee\b/i, /\bwhey\b/i
    ],
    allowIfAlsoHas: [/\bdairy[-\s]?free\b/i, /\blactose[-\s]?free\b/i],
  },
  nuts: {
    tag: "nut-free",
    disallow: [
      /\bpeanuts?\b/i, /\balmonds?\b/i, /\bwalnuts?\b/i, /\bcashews?\b/i, /\bpecans?\b/i,
      /\bhazelnuts?\b/i, /\bpistachios?\b/i, /\bmacadamias?\b/i, /\bpine ?nuts?\b/i, /\bnut\b/i
    ],
    allowIfAlsoHas: [/\bnut[-\s]?free\b/i],
  },
  egg: {
    tag: "egg-free",
    disallow: [/\beggs?\b/i, /\bmayonnaise\b/i, /\baioli\b/i],
    allowIfAlsoHas: [/\begg[-\s]?free\b/i],
  },
  soy: {
    tag: "soy-free",
    disallow: [/\bsoy\b/i, /\bsoybeans?\b/i, /\btofu\b/i, /\btempeh\b/i, /\bedamame\b/i, /\bsoy sauce\b/i, /\bmiso\b/i],
    allowIfAlsoHas: [/\bsoy[-\s]?free\b/i],
  },
  shellfish: {
    tag: "shellfish-free",
    disallow: [/\bshrimp\b/i, /\bprawns?\b/i, /\bcrab\b/i, /\blobster\b/i, /\bclam(s)?\b/i, /\boysters?\b/i, /\bmussels?\b/i, /\bscallops?\b/i],
    allowIfAlsoHas: [/\bshell[-\s]?fish[-\s]?free\b/i, /\bshellfish[-\s]?free\b/i],
  },
};

/** ---------------- Utilities ---------------- **/
function asText(recipe) {
  // Safely gather text from title, tags, ingredients, steps
  const parts = [];
  parts.push(String(recipe.title || ""));
  if (Array.isArray(recipe.tags)) parts.push(recipe.tags.join(" "));

  if (Array.isArray(recipe.ingredients)) {
    for (const ing of recipe.ingredients) {
      if (typeof ing === "string") parts.push(ing);
      else if (ing && typeof ing === "object") {
        parts.push([ing.name, ing.quantity, ing.note].filter(Boolean).join(" "));
      }
    }
  }
  if (Array.isArray(recipe.steps)) {
    for (const st of recipe.steps) {
      if (!st) continue;
      if (typeof st === "string") parts.push(st);
      else if (st && typeof st === "object") {
        parts.push([st.text, st.note].filter(Boolean).join(" "));
      }
    }
  }
  return parts.join(" ").trim();
}

/**
 * Decide if a "-free" tag is safe to add.
 * Logic:
 *  - If recipe already has the target "-free" tag (exact-ish): OK
 *  - Else check if any "allowIfAlsoHas" regex is present → OK
 *  - Else if any "disallow" regex present → NOT OK
 *  - Else → OK
 */
function shouldTagAsFree(text, currentTags, allergenConfig) {
  const existing = (currentTags || []).map((t) => String(t).toLowerCase());

  // Already tagged?
  if (existing.includes(allergenConfig.tag)) return true;

  // Whitelisted phrases like “gluten-free flour”
  if ((allergenConfig.allowIfAlsoHas || []).some((re) => re.test(text))) return true;

  // Disallowed ingredient words present?
  if ((allergenConfig.disallow || []).some((re) => re.test(text))) return false;

  // Otherwise safe to tag
  return true;
}

/** ---------------- Runner ---------------- **/
async function run() {
  const DRY = process.argv.includes("--dry");
  const WRITE = process.argv.includes("--write") || process.argv.includes("--force");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("🔗 Connected to MongoDB");

  const cursor = Recipe.find({}, { title: 1, tags: 1, ingredients: 1, steps: 1 }).lean().cursor();

  let scanned = 0;
  const updates = []; // { _id, add: [] }

  for await (const r of cursor) {
    scanned++;
    const text = asText(r);
    const currentTags = Array.isArray(r.tags) ? r.tags : [];
    const add = [];

    for (const key of Object.keys(ALLERGENS)) {
      const cfg = ALLERGENS[key];
      if (shouldTagAsFree(text, currentTags, cfg)) {
        // If we *should* tag, but it's *not already* present, queue it
        if (!currentTags.map((t) => String(t).toLowerCase()).includes(cfg.tag)) {
          add.push(cfg.tag);
        }
      }
    }

    if (add.length) {
      updates.push({ _id: r._id, add });
    }
    if (scanned % 200 === 0) {
      console.log(`...scanned ${scanned} recipes so far`);
    }
  }

  console.log(`\n📊 Summary: scanned ${scanned} recipes`);
  console.log(`Would add tags for ${updates.length} recipes`);

  if (DRY && !WRITE) {
    // Show a small sample of planned updates
    console.log("\n🔎 Dry run sample (first 5):");
    updates.slice(0, 5).forEach((u) => console.log(`- ${u._id}: +${u.add.join(", ")}`));
    await mongoose.disconnect();
    console.log("\n✅ Dry run complete. No changes written.");
    return;
  }

  if (!WRITE) {
    console.log("\nℹ️ Pass --dry to preview or --write to apply changes.");
    await mongoose.disconnect();
    return;
  }

  // Apply updates in batches
  let changed = 0;
  for (const u of updates) {
    await Recipe.updateOne(
      { _id: u._id },
      { $addToSet: { tags: { $each: u.add } } }
    );
    changed++;
    if (changed % 200 === 0) console.log(`...updated ${changed}`);
  }

  await mongoose.disconnect();
  console.log(`\n✅ Done. Updated ${changed} recipes.`);
}

run().catch((e) => {
  console.error("❌ Script error:", e);
  process.exit(1);
});