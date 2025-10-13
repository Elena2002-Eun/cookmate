require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// import routes
const searchRoutes = require("./routes/search");
const recipeRoutes = require("./routes/recipes");
const favoritesRoutes = require("./routes/favorites");
const authRoutes = require("./routes/auth");
const historyRoutes = require("./routes/history");
const pantryRoutes = require("./routes/pantry");

const app = express();

// --- flexible CORS allowlist (for localhost + Vercel) ---
const allowList = (process.env.CORS_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    try {
      const host = new URL(origin).hostname;
      if (allowList.includes(origin)) return cb(null, true);
      if (/\.vercel\.app$/.test(host)) return cb(null, true);
    } catch {}
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- MongoDB connection (local or cloud) ---
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cookmate";
mongoose
  .connect(MONGODB_URI)
  .then(() =>
    console.log(
      process.env.MONGODB_URI
        ? "✅ MongoDB connected (Atlas/cloud)"
        : "✅ MongoDB connected locally"
    )
  )
  .catch(err => console.error("Mongo error:", err));

// --- health endpoint ---
app.get("/", (_req, res) => {
  const mode = process.env.MONGODB_URI ? "cloud" : "local MongoDB";
  res.send(`CookMate API running (${mode})`);
});

// --- routes ---
app.use("/api/search", searchRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/pantry", pantryRoutes);

// --- start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));