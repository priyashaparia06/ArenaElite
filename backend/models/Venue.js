const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue / Ground name is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    supportedSports: [
      {
        type: String,
        trim: true, // e.g. ['FOOTBALL', 'CRICKET', 'BASKETBALL']
      },
    ],
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },
    facilities: [
      {
        type: String,
        trim: true, // e.g. ['Floodlights', 'Locker Rooms', 'Scoreboard', 'Medical Room']
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);
