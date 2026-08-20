const mongoose = require('mongoose');

// Embedded Player Schema
const playerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Player full name is required'],
      trim: true,
    },
    jerseyNumber: {
      type: Number,
      required: [true, 'Jersey number is required'],
      min: 0,
      max: 999,
    },
    role: {
      type: String,
      required: [true, 'Player role/position is required'],
      trim: true, // e.g., "Batsman", "Bowler", "Goalkeeper", "Forward", "Point Guard"
    },
    studentOrGovtId: {
      type: String,
      required: [true, 'Student or Govt ID proof number is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Main Team Schema
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sport: {
      type: String,
      required: [true, 'Sport category is required'],
      enum: ['CRICKET', 'FOOTBALL', 'BASKETBALL', 'BADMINTON', 'VOLLEYBALL', 'KABADDI'],
    },
    logoUrl: {
      type: String,
      default: '',
    },
    district: {
      type: String,
      required: [true, 'District/City is required'],
      trim: true,
    },
    players: [playerSchema],
  },
  { timestamps: true }
);

// Prevent duplicate jersey numbers within the same team
teamSchema.path('players').validate(function (players) {
  const jerseyNumbers = players.map((p) => p.jerseyNumber);
  return jerseyNumbers.length === new Set(jerseyNumbers).size;
}, 'Duplicate jersey number found in this team roster');

// Prevent duplicate ID proofs within the same team
teamSchema.path('players').validate(function (players) {
  const ids = players.map((p) => p.studentOrGovtId.toLowerCase());
  return ids.length === new Set(ids).size;
}, 'Duplicate Student/Govt ID proof found in this team roster');

module.exports = mongoose.model('Team', teamSchema);