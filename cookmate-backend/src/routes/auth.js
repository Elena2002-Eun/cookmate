// cookmate-backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* ----------------------------- AUTH ROUTES ----------------------------- */

// POST /api/auth/signup  { email, password }
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    return res.json({ msg: "User created", id: user._id });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login  { email, password } -> { token }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    return res.json({ token });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------- PROFILE ROUTES --------------------------- */

// Middleware: require valid JWT (works even without global middleware)
function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Auth required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ✅ GET /api/me → return user profile info (includes role)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user._id).select(
      "email displayName dietaryTags role"
    );
    if (!u) return res.status(404).json({ error: "Not found" });

    res.json({
      _id: u._id,
      email: u.email,
      displayName: u.displayName || "",
      dietaryTags: Array.isArray(u.dietaryTags) ? u.dietaryTags : [],
      role: u.role || "user", // ✅ Added this for Admin detection
    });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ PUT /api/me → update user profile
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { displayName, dietaryTags } = req.body || {};
    const safeName = String(displayName || "").trim();
    const safeTags = Array.isArray(dietaryTags)
      ? dietaryTags.map(String).map((s) => s.trim()).filter(Boolean)
      : [];

    const u = await User.findById(req.user._id);
    if (!u) return res.status(404).json({ error: "Not found" });

    u.displayName = safeName;
    u.dietaryTags = safeTags;
    await u.save();

    res.json({
      ok: true,
      displayName: u.displayName,
      dietaryTags: u.dietaryTags,
    });
  } catch (err) {
    console.error("PUT /me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;