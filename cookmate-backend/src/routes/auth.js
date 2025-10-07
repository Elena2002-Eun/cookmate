const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req,res)=>{
  try{
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already used' });
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name, email, passwordHash });
    res.json({ success:true });
  }catch(e){ res.status(500).json({ error:'Server error' }); }
});

router.post('/login', async (req,res)=>{
  try{
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn:'7d' });
    res.json({ token });
  }catch(e){ res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
