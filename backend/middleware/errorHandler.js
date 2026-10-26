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

  // MongoDB Atlas Connection & Selection Timeout Protection (503 Service Unavailable)
  const isMongoTimeout =
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoNetworkTimeoutError' ||
    err.name === 'MongooseServerSelectionError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('selection timed out')));

  if (isMongoTimeout) {
    res.setHeader('Retry-After', 3);
    return res.status(503).json({
      success: false,
      code: 'DB_BUSY',
      message: 'Database is experiencing high volume. Please retry in 3 seconds.',
      retryAfter: 3,
    });
  }

  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || (statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : 'SERVER_ERROR'),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
