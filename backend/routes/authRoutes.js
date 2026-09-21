const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  changePassword,
  getAdminProfile,
  registerStudent,
  checkStudentEmail,
  loginStudent,
  getStudentProfile,
  getMyAttempts,
  updateStudentProfile,
} = require('../controllers/authController');
const { requireAdminAuth, requireStudentAuth } = require('../middleware/authMiddleware');

// Student Auth Routes (Email + PIN, No OTP)
router.post('/check-email', checkStudentEmail);
router.post('/register', registerStudent);
router.post('/student-login', loginStudent);
router.get('/me', requireStudentAuth, getStudentProfile);
router.put('/profile', requireStudentAuth, updateStudentProfile);
router.get('/my-attempts', requireStudentAuth, getMyAttempts);

// Legacy aliases for compatibility
router.post('/student-register', registerStudent);

// Admin Auth Routes
router.post('/login', loginAdmin);
router.post('/change-password', requireAdminAuth, changePassword);
router.get('/admin/me', requireAdminAuth, getAdminProfile);

module.exports = router;
