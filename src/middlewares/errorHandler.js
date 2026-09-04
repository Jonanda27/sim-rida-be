const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || err.errorCode || 'INTERNAL_ERROR';

  // Do not log sensitive data, but log error summary for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  // Prisma Errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target ? ` on field (${err.meta.target})` : '';
    message = `Unique constraint violation${target}. Duplicate value not allowed.`;
    errorCode = 'CONFLICT_DUPLICATE';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record to operate on not found.';
    errorCode = 'NOT_FOUND';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint failed.';
    errorCode = 'FOREIGN_KEY_FAILED';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Cast standard error codes if status is known
  if (statusCode === 400 && errorCode === 'INTERNAL_ERROR') errorCode = 'BAD_REQUEST';
  if (statusCode === 401 && errorCode === 'INTERNAL_ERROR') errorCode = 'UNAUTHORIZED';
  if (statusCode === 403 && errorCode === 'INTERNAL_ERROR') errorCode = 'FORBIDDEN';
  if (statusCode === 404 && errorCode === 'INTERNAL_ERROR') errorCode = 'NOT_FOUND';
  if (statusCode === 409 && errorCode === 'INTERNAL_ERROR') errorCode = 'CONFLICT';
  if (statusCode === 422 && errorCode === 'INTERNAL_ERROR') errorCode = 'UNPROCESSABLE_ENTITY';

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
