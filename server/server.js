const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req,res) => {
  res.send('FanTeam Optimizer API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
