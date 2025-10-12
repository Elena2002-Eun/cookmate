const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.header("Authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1] : null;

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach just what we need
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    console.error("auth error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};