const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const JWT_SECRET = process.env.JWT_SECRET || 'quiz_system_super_secure_jwt_secret_2026_x99y';

// Administrator JWT Authentication
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing or malformed authentication token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required.',
      });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired administrative token. Please log in again.',
    });
  }
};

// Student JWT Authentication: Validates token and loads verified student from MongoDB
const requireStudentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please register or verify your email to access quizzes.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.studentId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid student session token.',
      });
    }

    const student = await Student.findById(decoded.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found. Please complete registration.',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in or register again.',
    });
  }
};

// Optional Student Auth for graceful fallback
const optionalStudentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.studentId) {
        const student = await Student.findById(decoded.studentId);
        if (student && student.emailVerified) {
          req.student = student;
        }
      }
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
};

module.exports = {
  requireAdminAuth,
  requireStudentAuth,
  optionalStudentAuth,
};
