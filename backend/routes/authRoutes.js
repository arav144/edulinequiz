const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  changePassword,
  getAdminProfile,
  registerStudent,
  checkStudentEmail,
  loginStudent,
  refreshStudentToken,
  getStudentProfile,
  getMyAttempts,
  updateStudentProfile,
} = require('../controllers/authController');
const { requireAdminAuth, requireStudentAuth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Student Auth Routes (Email + PIN, No OTP)
router.post('/check-email', authLimiter, checkStudentEmail);
router.post('/register', authLimiter, registerStudent);
router.post('/student-login', authLimiter, loginStudent);
router.post('/refresh-token', authLimiter, refreshStudentToken);
router.get('/me', requireStudentAuth, getStudentProfile);
router.put('/profile', requireStudentAuth, updateStudentProfile);
router.get('/my-attempts', requireStudentAuth, getMyAttempts);

// Legacy aliases for compatibility
router.post('/student-register', authLimiter, registerStudent);

// Admin Auth Routes
router.post('/login', authLimiter, loginAdmin);
router.post('/change-password', requireAdminAuth, changePassword);
router.get('/admin/me', requireAdminAuth, getAdminProfile);

module.exports = router;

