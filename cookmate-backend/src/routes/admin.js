// cookmate-backend/src/routes/admin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

const router = express.Router();

/* ----------------------- Helpers ----------------------- */
function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ---------------- Auth & Role Guards ------------------- */
// Works with or without a global JWT parser. If req.user exists, we trust it.
// Otherwise, decode the token here.
function requireAuth(req, res, next) {
  if (req.user && req.user._id) return next();

  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Auth required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ✅ Cleaner requireAdmin using .then syntax
function requireAdmin(req, res, next) {
  if (!req.user?._id) return res.status(401).json({ error: "Auth required" });
  User.findById(req.user._id)
    .select("role")
    .then((u) => {
      if (!u || u.role !== "admin")
        return res.status(403).json({ error: "Forbidden" });
      next();
    })
    .catch(() => res.status(500).json({ error: "Server error" }));
}

// Apply both guards to everything under /api/admin
router.use(requireAuth, requireAdmin);

/* ----------------------- Admin: Stats ----------------------- */
// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  try {
    const [users, recipes] = await Promise.all([
      User.countDocuments({}),
      Recipe.countDocuments({}),
    ]);
    res.json({ users, recipes });
  } catch (e) {
    console.error("admin/stats error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------- Admin: Recipes ---------------------- */
// GET /api/admin/recipes?query=&page=&pageSize=
router.get("/recipes", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || "20", 10), 1),
      100
    );
    const q = String(req.query.query || "").trim();

    const filter = q ? { title: { $regex: new RegExp(escapeRegex(q), "i") } } : {};

    const [items, total] = await Promise.all([
      Recipe.find(filter, {
        title: 1,
        tags: 1,
        difficulty: 1,
        imageUrl: 1,
        createdAt: 1,
        prepMinutes: 1,
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("admin/recipes list error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/recipes
router.post("/recipes", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const created = await Recipe.create(body);
    res.json(created);
  } catch (e) {
    console.error("admin/recipes create error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/admin/recipes/:id
router.put("/recipes/:id", async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body || {},
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    console.error("admin/recipes update error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/recipes/:id
router.delete("/recipes/:id", async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("admin/recipes delete error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------- Admin: Users ----------------------- */
// GET /api/admin/users?query=&page=&pageSize=
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || "20", 10), 1),
      100
    );
    const q = String(req.query.query || "").trim();

    const filter = q ? { email: { $regex: new RegExp(escapeRegex(q), "i") } } : {};

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("email displayName role createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("admin/users list error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/admin/users/:id/role  { role: 'user' | 'admin' }
router.put("/users/:id/role", async (req, res) => {
  try {
    const role = String((req.body || {}).role || "");
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("email role");
    if (!u) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, user: u });
  } catch (e) {
    console.error("admin/users role error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;