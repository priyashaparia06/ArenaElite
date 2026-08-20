const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/arenaelite';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected via Mongoose');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

  // Add this line with your other route definitions in backend/server.js:
app.use('/api/teams', require('./routes/teamRoutes'));