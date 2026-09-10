const mongoose = require('mongoose');

const classLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String, // e.g. 'Class 3'
      required: [true, 'Class name is required'],
      unique: true,
      trim: true,
    },
    displayHindi: {
      type: String, // e.g. 'कक्षा 3'
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    assignedQuizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.ClassLevel || mongoose.model('ClassLevel', classLevelSchema);
