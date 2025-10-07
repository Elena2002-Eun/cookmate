require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const searchRoutes = require('./routes/search');
const recipeRoutes = require('./routes/recipes');
const favoritesRoutes = require("./routes/favorites");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cookmate';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected locally'))
  .catch(err => console.error('Mongo error:', err));

app.get('/', (_req, res) => res.send('CookMate API running (local MongoDB)'));

app.use('/api/search', searchRoutes);
app.use('/api/recipes', recipeRoutes);
app.use("/api/favorites", favoritesRoutes);

app.listen(PORT, () => console.log(`API listening on port ${PORT}`));