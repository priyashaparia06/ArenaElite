const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    round: {
      type: String,
      default: 'Round 1',
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    assignedScorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      default: '',
      trim: true,
    },
    sportCategory: {
      type: String,
      required: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED'],
      default: 'SCHEDULED',
    },
    score: {
      teamAScore: { type: String, default: '' },
      teamBScore: { type: String, default: '' },
      resultSummary: { type: String, default: '' },
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
