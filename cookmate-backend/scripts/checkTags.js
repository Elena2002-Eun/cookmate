require("dotenv").config();
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // List all distinct tags
    const tags = await Recipe.distinct("tags");
    console.log("\nDistinct tags in DB:");
    console.log(tags);

    // Check gluten-free samples
    const gf = await Recipe.find({
      tags: { $elemMatch: { $regex: /^gluten[-\s]?free$/i } },
    })
      .limit(5)
      .select("title tags");

    console.log("\nSample gluten-free recipes:");
    console.log(gf.map((r) => ({ title: r.title, tags: r.tags })));

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();