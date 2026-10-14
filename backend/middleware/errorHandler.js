/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Centralized Application Security & Error Handling Middleware
 */

function errorHandler(err, req, res, next) {
  // Do not expose stack traces or raw database error dumps in client responses
  const status = err.status || 500;

  // Mask database / connection errors
  let clientMessage = err.message || 'An unexpected internal error occurred.';
  if (status === 500 && process.env.NODE_ENV === 'production') {
    clientMessage = 'An unexpected server error occurred. Please contact the administrator.';
  }

  // Prevent secret leakage in error logs
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    status: status,
    code: err.code || undefined,
  });

  return res.status(status).json({
    success: false,
    message: clientMessage,
    ...(err.category && { category: err.category }),
  });
}

function notFoundHandler(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  }
  // For non-API routes, let static router handle or serve index.html
  return res.status(404).sendFile(path.join(__dirname, '../../frontend/index.html'));
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
