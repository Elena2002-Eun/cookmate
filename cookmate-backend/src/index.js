// cookmate-backend/src/index.js
require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const jwt      = require("jsonwebtoken");

// --- import routes (each must `module.exports = router`) ---
const searchRoutes    = require("./routes/search");
const recipeRoutes    = require("./routes/recipes");
const favoritesRoutes = require("./routes/favorites");
const authRoutes      = require("./routes/auth");     // /signup, /login, /me
const historyRoutes   = require("./routes/history");
const pantryRoutes    = require("./routes/pantry");
const adminRoutes     = require("./routes/admin");    // /api/admin/*

const app = express();

/* -------------------------- CORS (safe defaults) -------------------------- */
const allowList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow server-side/no-origin
    if (allowList.includes(origin)) return cb(null, true);
    try {
      const host = new URL(origin).hostname;
      if (/\.vercel\.app$/.test(host)) return cb(null, true);
    } catch {}
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

/* ---------------- JWT middleware (populate req.user if token present) ---------------- */
app.use((req, _res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: decoded.id };
    } catch {
      // ignore invalid/expired tokens
    }
  }
  next();
});

/* --------------------------- Mongo connection --------------------------- */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cookmate";

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

/* ----------------------------- Health check ----------------------------- */
app.get("/", (_req, res) => {
  const mode = process.env.MONGODB_URI ? "cloud" : "local MongoDB";
  res.send(`CookMate API running (${mode})`);
});

/* -------------------------------- Routes -------------------------------- */
// Public/normal API
app.use("/api/search",    searchRoutes);
app.use("/api/recipes",   recipeRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/history",   historyRoutes);
app.use("/api/pantry",    pantryRoutes);

// Auth + Profile live in the same router file:
// - POST /api/auth/signup
// - POST /api/auth/login
// - GET  /api/me
// - PUT  /api/me
app.use("/api/auth", authRoutes); // /api/auth/signup, /api/auth/login
app.use("/api", authRoutes);

// Admin (all endpoints /api/admin/*; router itself checks admin role)
app.use("/api/admin", adminRoutes);

/* ------------------------------ Debug helper ------------------------------ */
// Hit http://localhost:4000/__routes to see mounted routes
app.get("/__routes", (req, res) => {
  const out = [];
  function walk(stack, prefix = "") {
    (stack || []).forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase())
          .join(",");
        out.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === "router" && layer.handle?.stack) {
        walk(layer.handle.stack, prefix);
      }
    });
  }
  walk(app._router?.stack);
  res.json(out);
});

/* ------------------------------- Start app ------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API listening on port ${PORT}`));