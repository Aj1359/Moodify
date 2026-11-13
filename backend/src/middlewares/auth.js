const { supabase } = require('../config/supabase');
const { ERROR_CODES } = require('../config/constants');

/**
 * Supabase JWT Authentication Middleware.
 * Checks `Authorization: Bearer <token>` and populates `req.user = { id, email }`.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token missing, expired or invalid',
      },
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token missing, expired or invalid',
      },
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Token missing, expired or invalid',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return res.status(401).json({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Token missing, expired or invalid',
      },
    });
  }
}

module.exports = {
  requireAuth,
};

