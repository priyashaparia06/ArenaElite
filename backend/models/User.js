const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'ORGANIZER', 'CAPTAIN', 'SCORER'],
      default: 'CAPTAIN',
    },
    district: { type: String, required: true, trim: true },
    organizationName: { type: String, default: null }, // Used if role === 'ORGANIZER'
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: function () {
        return this.role === 'ORGANIZER' ? 'PENDING' : 'APPROVED';
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);