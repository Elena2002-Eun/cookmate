// scripts/backupRecipes.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const all = await Recipe.find({}).lean();
    const out = path.join(__dirname, `recipes-backup-${Date.now()}.json`);
    fs.writeFileSync(out, JSON.stringify(all, null, 2));
    console.log(`✅ Backed up ${all.length} recipes -> ${out}`);
  } catch (e) {
    console.error("Backup failed:", e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();