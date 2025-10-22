// scripts/updateAllRecipesSteps.js
require("dotenv").config();
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");

/** ========= 1) Your default detailed steps template =========
 * You can customize these, or add title-based overrides below.
 */
const defaultSteps = [
  {
    text: "Prep: Wash and cut vegetables. Measure spices and liquids.",
    durationSec: 180,
    ingredientsUsed: []
  },
  {
    text: "Heat 1–2 tbsp oil in a pot over medium heat until shimmering.",
    durationSec: 120,
    ingredientsUsed: ["oil"]
  },
  {
    text: "Aromatics: Add onion/garlic and sauté until translucent and fragrant.",
    durationSec: 300,
    ingredientsUsed: ["onion", "garlic"]
  },
  {
    text: "Main ingredients: Add core items (lentils/pasta/rice/veg). Stir to coat.",
    durationSec: 120,
    ingredientsUsed: []
  },
  {
    text: "Add liquid (broth/water). Bring to a boil, then reduce to a gentle simmer.",
    durationSec: 180,
    ingredientsUsed: ["broth", "water"]
  },
  {
    text: "Simmer until tender, stirring occasionally. Skim foam if needed.",
    durationSec: 900,
    ingredientsUsed: []
  },
  {
    text: "Season to taste (salt, pepper, herbs). Rest 2 minutes and serve warm.",
    durationSec: 120,
    ingredientsUsed: ["salt", "pepper"]
  }
];

/** ========= 2) Optional: per-recipe overrides by title =========
 * Use regex tests to assign nicer steps per dish name.
 */
function stepsForTitle(title = "") {
  const t = String(title).toLowerCase();

  if (/pancake|pancakes/.test(t)) {
    return [
      { text: "Whisk dry ingredients: flour, sugar, baking powder, salt.", durationSec: 180, ingredientsUsed: ["flour","sugar","baking powder","salt"] },
      { text: "Whisk wet ingredients: milk, egg, melted butter.", durationSec: 180, ingredientsUsed: ["milk","egg","butter"] },
      { text: "Combine wet into dry. Mix just until no dry pockets remain.", durationSec: 120, ingredientsUsed: [] },
      { text: "Preheat pan on medium. Lightly oil. Pour 1/4 cup batter per pancake.", durationSec: 300, ingredientsUsed: ["oil"] },
      { text: "Flip when bubbles form and edges set. Cook until golden.", durationSec: 240, ingredientsUsed: [] },
      { text: "Serve with syrup/fruit. Optional: keep warm in low oven.", durationSec: 60, ingredientsUsed: [] },
    ];
  }

  if (/lentil|dal|dahl|soup/.test(t)) {
    return [
      { text: "Rinse lentils. Chop onion, carrot, celery, garlic.", durationSec: 240, ingredientsUsed: ["lentils","onion","carrot","celery","garlic"] },
      { text: "Sauté onion, carrot, celery in oil over medium heat until softened.", durationSec: 360, ingredientsUsed: ["oil","onion","carrot","celery"] },
      { text: "Add garlic and spices; cook 30–60s until fragrant.", durationSec: 60, ingredientsUsed: ["garlic"] },
      { text: "Add lentils and broth/water. Bring to a boil, then reduce to simmer.", durationSec: 180, ingredientsUsed: ["lentils","broth","water"] },
      { text: "Simmer gently until lentils are tender; stir occasionally.", durationSec: 1200, ingredientsUsed: [] },
      { text: "Season with salt/pepper/lemon. Optional: blend partially for creaminess.", durationSec: 120, ingredientsUsed: ["salt","pepper"] },
    ];
  }

  // Fallback
  return defaultSteps;
}

/** ========= 3) Policy: which recipes to update? =========
 * Default: update only if steps are empty or too short (len < 2).
 * You can FORCE update all by passing --force
 */
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");

function needsUpdate(rec) {
  if (FORCE) return true;
  const steps = Array.isArray(rec.steps) ? rec.steps : [];
  return steps.length < 2; // treat sparse/non-English/too short as needing upgrade
}

(async () => {
  let updated = 0;
  let skipped = 0;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const recipes = await Recipe.find({});
    console.log(`Found ${recipes.length} recipes`);
    console.log(`Mode: ${DRY_RUN ? "DRY-RUN (no DB writes)" : "APPLYING CHANGES"}${FORCE ? " — FORCE" : ""}`);

    for (const recipe of recipes) {
      if (!needsUpdate(recipe)) {
        skipped++;
        continue;
      }
      const newSteps = stepsForTitle(recipe.title);
      // minimal validation
      const normalized = (newSteps || []).map(s => ({
        text: String(s.text || "").trim(),
        durationSec: Math.max(0, Number(s.durationSec || 0)),
        ingredientsUsed: Array.isArray(s.ingredientsUsed) ? s.ingredientsUsed : []
      }));

      if (DRY_RUN) {
        console.log(`DRY: would update "${recipe.title}" (${recipe._id}) with ${normalized.length} steps`);
      } else {
        recipe.steps = normalized;
        await recipe.save();
        console.log(`✅ Updated: ${recipe.title}`);
        updated++;
      }
    }

    console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  } catch (err) {
    console.error("Error updating recipes:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();