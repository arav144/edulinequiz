const express = require('express');
const router = express.Router();
const {
  getAvailableQuizzes,
  getQuizById,
  startQuiz,
  submitQuizAttempt,
} = require('../controllers/quizController');
const { optionalStudentAuth, requireStudentAuth } = require('../middleware/authMiddleware');

// Student endpoints
router.get('/', optionalStudentAuth, getAvailableQuizzes);
router.get('/available', optionalStudentAuth, getAvailableQuizzes);
router.get('/:id', optionalStudentAuth, getQuizById);
router.get('/:id/start', optionalStudentAuth, startQuiz);
router.post('/:id/start', optionalStudentAuth, startQuiz);
router.post('/:id/attempt', optionalStudentAuth, submitQuizAttempt);

module.exports = router;
