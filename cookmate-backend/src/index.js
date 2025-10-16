require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// --- import routes ---
const searchRoutes = require("./routes/search");
const recipeRoutes = require("./routes/recipes");
const favoritesRoutes = require("./routes/favorites");
const authRoutes = require("./routes/auth");
const historyRoutes = require("./routes/history");
const pantryRoutes = require("./routes/pantry");

const app = express();

// --- CORS configuration (robust, avoids 500 on preflight) ---
const allowList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Allow same-origin tools or server-side requests
    if (!origin) return cb(null, true);

    // Allow exact matches from env
    if (allowList.includes(origin)) return cb(null, true);

    // Allow any *.vercel.app frontend
    try {
      const host = new URL(origin).hostname;
      if (/\.vercel\.app$/.test(host)) return cb(null, true);
    } catch {
      // ignore invalid origin parse
    }

    // Deny gracefully instead of throwing (prevents 500 errors)
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204, // ensures smooth preflight handling
};

// Apply CORS globally + handle all preflight
app.use(cors(corsOptions));

app.use(express.json());

// --- MongoDB connection (local or Atlas) ---
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
  .catch((err) => console.error("Mongo error:", err));

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
app.listen(PORT, () => console.log(`🚀 API listening on port ${PORT}`));