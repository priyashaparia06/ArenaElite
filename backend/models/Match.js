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
    roundIndex: {
      type: Number,
      default: 1,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    assignedScorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    scheduledDate: {
      type: Date,
      default: null,
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
    isBye: {
      type: Boolean,
      default: false,
    },
    score: {
      teamAScore: { type: String, default: '' },
      teamBScore: { type: String, default: '' },
      resultSummary: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    nextMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    nextMatchSlot: {
      type: String,
      enum: ['teamA', 'teamB', null],
      default: null,
    },
    sourceMatchA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    sourceMatchB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
