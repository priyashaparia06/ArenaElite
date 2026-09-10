const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tournaments', require('./routes/tournamentRoutes'));

// Public convenience endpoints for active sports and venues
app.get('/api/public/sports', async (req, res) => {
  try {
    const SportCategory = require('./models/SportCategory');
    const sports = await SportCategory.find({ isActive: true }).sort({ name: 1 });
    res.json(sports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sports', error: err.message });
  }
});

app.get('/api/public/venues', async (req, res) => {
  try {
    const Venue = require('./models/Venue');
    const { district, sport } = req.query;
    const filter = { isActive: true };
    if (district) filter.district = new RegExp(district, 'i');
    if (sport) filter.supportedSports = sport.toUpperCase();
    const venues = await Venue.find(filter).sort({ district: 1, name: 1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Arena Elite Backend', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arenaelite';

const seedDatabase = require('./seed');
const User = require('./models/User');

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected via Mongoose');
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('Empty database detected. Auto-seeding default admin and data...');
        await seedDatabase();
      }
    } catch (e) {
      console.warn('Auto-seed check failed:', e.message);
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));