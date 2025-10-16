// tools/seeds/make300.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.env.HOME || process.env.USERPROFILE;
const seedDir = path.join(root, "Projects/cookmate/tools/seeds");
const inputFile = path.join(seedDir, "recipes.sample.json");
const outputFile = path.join(seedDir, "recipes.300.json");

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const DIFFICULTIES = ["easy", "medium", "hard"];
const EXTRA_TAGS = [
  "quick", "comfort", "healthy", "kid-friendly", "one-pot",
  "spicy", "gluten-free", "low-carb", "budget", "weeknight"
];
const EXTRA_ING = [
  "garlic", "onion", "olive oil", "butter", "salt", "pepper",
  "chili flakes", "parsley", "basil", "cheddar", "parmesan",
  "soy sauce", "honey", "lemon", "ginger", "tomato", "spinach",
  "mushroom", "chicken", "tofu", "rice", "pasta"
];

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function uniqueTitle(base, idx) {
  // e.g. "Simple Pancakes #17"
  return `${base} #${idx}`;
}

function varyTags(tags) {
  const set = new Set(tags || []);
  const extra = rnd(0, 2);
  for (let i = 0; i < extra; i++) {
    set.add(EXTRA_TAGS[rnd(0, EXTRA_TAGS.length - 1)]);
  }
  return Array.from(set).slice(0, 5);
}

function varyDifficulty(base) {
  if (!base) return DIFFICULTIES[rnd(0, 2)];
  // ~30% chance to change difficulty
  return Math.random() < 0.3 ? DIFFICULTIES[rnd(0, 2)] : base;
}

function varyIngredients(ings) {
  const list = (ings || []).map(obj => ({ ...obj }));
  // maybe add 0–2 extra simple ingredients (no quantity)
  const extraCount = rnd(0, 2);
  for (let i = 0; i < extraCount; i++) {
    const name = EXTRA_ING[rnd(0, EXTRA_ING.length - 1)];
    if (!list.some(x => (x.name || "").toLowerCase() === name)) {
      list.push({ name, quantity: "" });
    }
  }
  return list.slice(0, 15);
}

function varySteps(steps) {
  const base = (steps || []).map(s => ({ ...s }));
  // With small chance add a generic step
  if (Math.random() < 0.25) {
    base.push({ text: "Taste and adjust seasoning to your preference." });
  }
  return base.slice(0, 10);
}

const sample = loadJSON(inputFile);
if (!Array.isArray(sample) || sample.length === 0) {
  console.error("No sample recipes found in recipes.sample.json");
  process.exit(1);
}

const target = 300;
const out = [];
let idx = 1;

while (out.length < target) {
  for (const base of sample) {
    if (out.length >= target) break;

    const title = uniqueTitle(base.title || "Recipe", idx);
    const difficulty = varyDifficulty(base.difficulty || "easy");
    const tags = varyTags(base.tags || []);
    const ingredients = varyIngredients(base.ingredients || []);
    const steps = varySteps(base.steps || []);

    out.push({
      title,
      difficulty,
      tags,
      ingredients,
      steps
    });

    idx++;
  }
}

fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} recipes → ${outputFile}`);