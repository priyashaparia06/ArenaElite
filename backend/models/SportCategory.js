const mongoose = require('mongoose');

const sportCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sport category name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Sport code is required'],
      unique: true,
      uppercase: true,
      trim: true, // e.g. FOOTBALL, CRICKET, BASKETBALL
    },
    icon: {
      type: String,
      default: '🏆',
    },
    playersPerTeam: {
      type: Number,
      required: [true, 'Playing team size is required'],
      min: 1,
    },
    minSquadSize: {
      type: Number,
      default: 1,
    },
    maxSquadSize: {
      type: Number,
      default: 25,
    },
    formatType: {
      type: String,
      enum: ['TIME_BASED', 'OVERS_BASED', 'SETS_BASED', 'POINTS_BASED'],
      default: 'TIME_BASED',
    },
    defaultMatchDuration: {
      type: Number, // In minutes (football: 90), overs (cricket: 20), or sets (badminton: 3)
      default: 60,
    },
    rulesDescription: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SportCategory', sportCategorySchema);
