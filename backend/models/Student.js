const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentIdentifier: {
      type: String,
      required: [true, 'Student Identifier (Roll Number or ID) is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    className: {
      type: String,
      trim: true,
      default: '',
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    schoolName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
