const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAdminQuizzes,
  createQuiz,
  getAdminQuizById,
  updateQuiz,
  deleteQuiz,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllAttempts,
  getAttemptById,
  getQuizAttempts,
} = require('../controllers/adminController');
const { createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

// Protect all admin routes with JWT
router.use(requireAdminAuth);

// Dashboard
router.get('/stats', getDashboardStats);

// Quiz Management
router.get('/quizzes', getAdminQuizzes);
router.post('/quizzes', createQuiz);
router.get('/quizzes/:id', getAdminQuizById);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);
router.get('/quizzes/:id/attempts', getQuizAttempts);

// Question Management
router.get('/questions', getAllQuestions);
router.post('/questions', addQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Subject Management
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Attempts / Results
router.get('/attempts', getAllAttempts);
router.get('/attempts/:id', getAttemptById);

module.exports = router;
