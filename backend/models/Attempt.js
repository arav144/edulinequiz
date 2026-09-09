const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
      index: true,
    },
    studentIdentifier: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
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
    answers: {
      type: Map,
      of: String, // QuestionId -> 'A' | 'B' | 'C' | 'D'
      default: {},
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    result: {
      type: String,
      enum: ['Pass', 'Fail'],
      default: 'Fail',
    },
    certificateId: {
      type: String,
      default: '',
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// STRICT DATABASE-LEVEL UNIQUE CONSTRAINT:
// Enforces that one student can attempt a specific quiz only ONE time.
attemptSchema.index({ studentId: 1, quizId: 1 }, { unique: true });

module.exports = mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);
