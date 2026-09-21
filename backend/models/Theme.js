const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    // Top-Right Header Illustration / Branding
    topRightImage: {
      type: String,
      default: '/img/ghadhi.png',
      trim: true,
    },
    showTopRightImage: {
      type: Boolean,
      default: true,
    },
    topRightImageWidth: {
      type: Number,
      default: 160,
      min: 50,
      max: 500,
    },
    topRightTop: {
      type: Number,
      default: 80,
    },
    topRightRight: {
      type: Number,
      default: 40,
    },
    // Background Configuration
    enableBgImage: {
      type: Boolean,
      default: true,
    },
    bgImage: {
      type: String,
      default: '/img/background.jpg',
      trim: true,
    },
    bgColor: {
      type: String,
      default: '#FAF9F5',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Theme || mongoose.model('Theme', themeSchema);
