const errorHandler = (err, req, res, next) => {
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err);

  // MongoDB Unique Constraint Violation (e.g. duplicate attempt)
  if (err.code === 11000) {
    const isAttempt = err.message && (err.message.includes('studentId') || err.message.includes('studentIdentifier'));
    return res.status(403).json({
      success: false,
      code: 'DUPLICATE_ATTEMPT',
      message: isAttempt
        ? 'This quiz has already been attempted by this student. Only one attempt is permitted.'
        : 'A duplicate record exists with these unique attributes.',
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: messages,
    });
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for parameter: ${err.path}`,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
