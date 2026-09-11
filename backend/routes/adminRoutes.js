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
  updateQuizSchedule,
  updateBatchQuizSchedule,
  getScheduledBatches,
  removeScheduledBatch,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllAttempts,
  getAttemptById,
  getQuizAttempts,
} = require('../controllers/adminController');
const { createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const {
  getAdminClasses,
  createClass,
  updateClass,
  deleteClass,
  toggleClassActive,
  assignQuizToClass,
} = require('../controllers/classController');

// Protect all admin routes with JWT
router.use(requireAdminAuth);

// Dashboard
router.get('/stats', getDashboardStats);

// Quiz Management
router.get('/quizzes', getAdminQuizzes);
router.post('/quizzes', createQuiz);
router.get('/quizzes/schedule/batches', getScheduledBatches);
router.delete('/quizzes/schedule/batch/:batchId', removeScheduledBatch);
router.post('/quizzes/schedule/batch', updateBatchQuizSchedule);
router.get('/quizzes/:id', getAdminQuizById);
router.put('/quizzes/:id', updateQuiz);
router.patch('/quizzes/:id/schedule', updateQuizSchedule);
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

// Class Management (कक्षा प्रबंधन)
router.get('/classes', getAdminClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.patch('/classes/:id/toggle', toggleClassActive);
router.patch('/classes/:id/assign-quiz', assignQuizToClass);

// Attempts / Results
router.get('/attempts', getAllAttempts);
router.get('/attempts/:id', getAttemptById);

module.exports = router;
