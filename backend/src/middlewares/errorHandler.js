const { ERROR_CODES } = require('../config/constants');

/**
 * Central Error Handler Middleware.
 * Catches unhandled errors, logs them internally, and returns a clean 500 envelope.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Unhandled server error:', err);

  return res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected internal error occurred',
    },
  });
}

module.exports = {
  errorHandler,
};

