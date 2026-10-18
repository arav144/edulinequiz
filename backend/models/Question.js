const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz association is required'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    question: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
    },
    options: {
      A: { type: String, required: [true, 'Option A is required'], trim: true },
      B: { type: String, required: [true, 'Option B is required'], trim: true },
      C: { type: String, required: [true, 'Option C is required'], trim: true },
      D: { type: String, required: [true, 'Option D is required'], trim: true },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer key is required'],
      enum: {
        values: ['A', 'B', 'C', 'D'],
        message: 'Correct answer must be strictly A, B, C, or D',
      },
      uppercase: true,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: '',
      trim: true,
    },
    audioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    audioPublicId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for subject-based fallback queries
questionSchema.index({ subjectId: 1 });

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);

