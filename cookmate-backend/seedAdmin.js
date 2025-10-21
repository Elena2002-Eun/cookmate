// cookmate-backend/seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// --- Resolve User model from ./models/User.js OR ./src/models/User.js ---
function loadUserModel() {
  const candidates = [
    "./models/User.js",
    "./models/User",
    "./src/models/User.js",
    "./src/models/User",
  ];
  for (const p of candidates) {
    const full = path.join(__dirname, p);
    if (fs.existsSync(full)) {
      // eslint-disable-next-line import/no-dynamic-require
      return require(p);
    }
  }
  throw new Error(
    "❌ Cannot find User model. Tried ./models/User(.js) and ./src/models/User(.js)."
  );
}

const User = loadUserModel();

(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cookmate";
  const email = "admin@cookmate.app"; // change if needed
  const password = "changeme123"; // temporary password

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    let user = await User.findOne({ email });

    if (!user) {
      console.log("ℹ️ No user found, creating new admin user...");
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        passwordHash,
        role: "admin",
      });
      console.log(`✅ Created admin user: ${email}`);
      console.log(`🔑 Temporary password: ${password}`);
    } else {
      if (user.role !== "admin") {
        user.role = "admin";
        await user.save();
        console.log(`✅ Promoted existing user to admin: ${email}`);
      } else {
        console.log(`ℹ️ ${email} is already an admin (no changes made).`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
})();