const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'admin',
    },
    password: {
      type: String,
      required: true,
      default: 'admin123',
    },
    role: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
