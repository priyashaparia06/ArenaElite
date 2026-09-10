const mongoose = require('mongoose');

const registeredTeamSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sportCategory: {
      type: String,
      required: [true, 'Sport category code is required'],
      uppercase: true,
      trim: true, // e.g. 'FOOTBALL', 'CRICKET'
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
    },
    venueName: {
      type: String,
      required: [true, 'Venue / Ground name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    maxTeams: {
      type: Number,
      default: 16,
      min: 2,
    },
    format: {
      type: String,
      enum: ['KNOCKOUT', 'ROUND_ROBIN', 'LEAGUE_PLUS_KNOCKOUT'],
      default: 'KNOCKOUT',
    },
    rules: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'REGISTRATION_OPEN',
    },
    registeredTeams: [registeredTeamSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
