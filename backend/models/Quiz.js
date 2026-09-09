const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Quiz name is required'],
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    numberOfQuestions: {
      type: Number,
      required: [true, 'Total number of configured questions is required'],
      min: [1, 'A quiz must have at least 1 question'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Draft',
      index: true,
    },
    passingPercentage: {
      type: Number,
      default: 50,
      min: [0, 'Passing percentage cannot be negative'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    timePerQuestion: {
      type: Number,
      default: 30,
      min: [5, 'Time per question must be at least 5 seconds'],
      max: [600, 'Time per question cannot exceed 600 seconds'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    contactInfo: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

