const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/register', async (req,res) => {
  const { email, password, tier } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed, tier || 'FREE');
    res.json({ id: user.id, email: user.email, tier: user.tier });
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await findUserByEmail(email);
    if(!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, tier: user.tier }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
