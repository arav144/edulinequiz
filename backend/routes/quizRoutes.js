const express = require('express');
const router = express.Router();
const {
  getAvailableQuizzes,
  verifyStudentAttempt,
  startQuiz,
  submitQuizAttempt,
} = require('../controllers/quizController');

// Student endpoints
router.get('/available', getAvailableQuizzes);
router.post('/:id/verify-student', verifyStudentAttempt);
router.get('/:id/start', startQuiz);
router.post('/:id/attempt', submitQuizAttempt);

module.exports = router;
