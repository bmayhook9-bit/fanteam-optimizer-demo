const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.sendStatus(401);
  const token = header.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.use('/api/auth', authRoutes);

app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: `Hello ${req.user.username}!`, tier: req.user.tier });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
