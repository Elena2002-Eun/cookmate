require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cookmate');

    await Recipe.deleteMany({});
    await Recipe.insertMany([
      {
        title: 'Simple Pancakes',
        ingredients: [
          { name: 'flour', quantity: '200g' },
          { name: 'egg', quantity: '1' },
          { name: 'milk', quantity: '250ml' },
          { name: 'butter', quantity: 'a little' }
        ],
        ingredientText: 'flour egg milk sugar baking powder butter',
        steps: [
          { order: 1, text: 'Mix dry ingredients', durationSec: 60 },
          { order: 2, text: 'Add milk & egg', durationSec: 60 },
          { order: 3, text: 'Cook on pan', durationSec: 300 }
        ],
        prepTimeMin: 20,
        difficulty: 'easy',
        tags: ['breakfast', 'vegetarian']
      },
      {
        title: 'Garlic Butter Pasta',
        ingredients: [
          { name: 'pasta', quantity: '200g' },
          { name: 'garlic', quantity: '3 cloves' },
          { name: 'butter', quantity: '50g' }
        ],
        ingredientText: 'pasta garlic butter parsley parmesan',
        steps: [
          { order: 1, text: 'Boil pasta', durationSec: 600 },
          { order: 2, text: 'Sauté garlic in butter', durationSec: 180 },
          { order: 3, text: 'Toss pasta', durationSec: 60 }
        ],
        prepTimeMin: 25,
        difficulty: 'easy',
        tags: ['dinner']
      }
    ]);

    console.log('✅ Seeded recipes');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();