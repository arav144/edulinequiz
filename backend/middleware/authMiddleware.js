const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const cacheService = require('../services/cacheService');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to verify student existence/status with 10-minute (600s) in-memory caching
// Ensures high concurrency submissions and quiz starts do not hit MongoDB for auth verification
async function getVerifiedStudent(studentId, ttl = 600) {
  if (!studentId) return null;
  const cacheKey = `student_status:${studentId}`;

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const student = await Student.findById(studentId)
        .select('_id email class className name firstName lastName studentIdentifier isBlocked emailVerified schoolName')
        .lean();

      if (!student || student.isBlocked === true) {
        return null;
      }
      return student;
    },
    ttl // 600 seconds (10 minutes) TTL
  );
}

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

// Student JWT Authentication:
// Validates token statelessly & checks active student status via 10-minute memory cache
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
    if (!decoded.studentId || (decoded.type && decoded.type !== 'access')) {
      return res.status(403).json({
        success: false,
        message: 'Invalid student access token. Refresh tokens cannot be used as access tokens.',
      });
    }

    // Verify student is not deleted or blocked (cached for 10 minutes)
    const student = await getVerifiedStudent(decoded.studentId, 600);
    if (!student) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Student account not found or has been deactivated. Please contact support.',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired
        ? 'Session expired. Please refresh your session or sign in again.'
        : 'Session invalid. Please sign in or register again.',
    });
  }
};

// Optional Student Auth for graceful fallback (0 DB read when valid JWT presented)
const optionalStudentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.studentId && (!decoded.type || decoded.type === 'access')) {
        // Check 10-min in-memory cache
        const student = await getVerifiedStudent(decoded.studentId, 600);
        if (student) {
          req.student = student;
        } else if (decoded.studentId) {
          // Stateless fallback from verified JWT: 0 DB reads
          req.student = {
            _id: decoded.studentId,
            email: decoded.email,
            class: decoded.class,
            className: decoded.class,
            studentIdentifier: decoded.studentIdentifier,
            name: decoded.name,
            schoolName: decoded.schoolName || '',
          };
        }
      }
    } catch {
      // Ignore invalid/expired token in optional auth
    }
  }
  next();
};

module.exports = {
  requireAdminAuth,
  requireStudentAuth,
  optionalStudentAuth,
  getVerifiedStudent,
};

