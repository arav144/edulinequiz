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
      default: 'Better Luck Next Time',
    },
    certificateId: {
      type: String,
      default: '',
      trim: true,
    },
    previousCertificateId: {
      type: String,
      default: null,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    timingFlag: {
      type: String,
      enum: ['verified', 'unverified', 'late'],
      default: 'verified',
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes for high-concurrency queries
attemptSchema.index({ studentId: 1, quizId: 1 }, { unique: true });
attemptSchema.index({ studentId: 1, submittedAt: -1 });
attemptSchema.index({ submittedAt: -1 });
attemptSchema.index({ certificateId: 1 }, { unique: true, sparse: true });
attemptSchema.index({ studentIdentifier: 1, createdAt: -1 });

module.exports = mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);

