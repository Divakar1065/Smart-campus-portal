/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Authentication & Access Control Middleware
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ats_development_jwt_secret_key_2026';

/**
 * Verifies JWT Bearer token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization header provided.',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Expected "Bearer <token>".',
    });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
}

/**
 * Enforces role-based permissions (e.g. 'admin', 'faculty', 'student')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This operation requires one of: [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
}

/**
 * Enforces Student Data Isolation:
 * A student user may ONLY query or mutate their own student profile/data.
 * Admins and faculty have institutional cross-student access.
 */
function verifyStudentOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  // Admins and faculty can access any student's data
  if (req.user.role === 'admin' || req.user.role === 'faculty') {
    return next();
  }

  // If role is student, resolve target student_id from params, query, or body
  const targetStudentId = parseInt(
    req.params.studentId || req.query.student_id || req.body.student_id || req.user.student_id,
    10
  );

  if (!req.user.student_id || targetStudentId !== req.user.student_id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are only authorized to access your own academic records.',
    });
  }

  next();
}

module.exports = {
  verifyToken,
  requireRole,
  verifyStudentOwnership,
  JWT_SECRET,
};
