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
      default: 40,
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
    classes: {
      type: [String],
      default: [],
      index: true,
    },
    targetClass: {
      type: String,
      trim: true,
      default: 'All',
      index: true,
    },
    startDate: {
      type: Date,
      default: () => new Date('2026-08-15'),
    },
    endDate: {
      type: Date,
      default: () => new Date('2026-09-30'),
    },
    totalScore: {
      type: Number,
      default: 20,
    },
    timing: {
      type: String,
      trim: true,
      default: '00:10 Hours',
    },
    durationMinutes: {
      type: Number,
      default: 10,
    },
    bannerUrl: {
      type: String,
      trim: true,
      default: '/img/hindidiwas.png',
    },
    scheduleStatus: {
      type: String,
      enum: ['Ongoing', 'Upcoming', 'Past'],
      default: 'Ongoing',
    },
    isFeaturedOnPortal: {
      type: Boolean,
      default: true,
      index: true,
    },
    showTiming: {
      type: Boolean,
      default: true,
    },
    scheduleBatchId: {
      type: String,
      default: null,
      index: true,
    },
    batchName: {
      type: String,
      trim: true,
      default: '',
    },
    isRepresentative: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-concurrency portal and class queries
quizSchema.index({ status: 1, isFeaturedOnPortal: 1, createdAt: -1 });
quizSchema.index({ status: 1, createdAt: -1 });
quizSchema.index({ scheduleBatchId: 1, status: 1 });
quizSchema.index({ targetClass: 1, status: 1 });

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);


