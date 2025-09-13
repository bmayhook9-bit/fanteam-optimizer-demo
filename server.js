const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Define user tiers
const TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ELITE: 'ELITE'
};

// Simple user lookup. In real app, replace with auth logic
function getUser() {
  const tier = process.env.USER_TIER || TIERS.FREE;
  return { tier };
}

// API endpoint exposing current user's tier
app.get('/api/user', (req, res) => {
  res.json(getUser());
});

// Serve demo assets publicly without auth
app.use('/demo', express.static(path.join(__dirname, 'public/demo')));

// Serve other static assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
