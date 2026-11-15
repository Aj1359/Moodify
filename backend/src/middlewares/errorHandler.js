/**
 * Error handling for every route (docs/api.md, Response format).
 *
 * - notFound: unknown paths get 404 NOT_FOUND in the standard envelope.
 * - errorHandler: turns known failures into the contract's codes and
 *   everything else into a 500 without leaking internals.
 */
const { ERROR_CODES } = require('../config/constants');

// Postgres error codes returned by Supabase (PostgREST passes them through)
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_INVALID_TEXT = '22P02';

const send = (res, status, code, message) => res.status(status).json({ error: { code, message } });

function notFound(req, res) {
  return send(res, 404, ERROR_CODES.NOT_FOUND, `No route for ${req.method} ${req.path}`);
}

/**
 * Map an error to { status, code, message } from the contract, or null if unknown.
 * @param {any} err
 */
function classifyError(err) {
  if (!err || typeof err !== 'object') return null;

  // Body parser: malformed JSON or an oversized body is the client's mistake
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: ERROR_CODES.VALIDATION_ERROR, message: 'Request body must be valid JSON' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: ERROR_CODES.VALIDATION_ERROR, message: 'Request body is too large' };
  }

  // A row points at something that does not exist
  if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    const text = `${err.details || ''} ${err.message || ''}`;
    if (/song_id/.test(text)) {
      return { status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Song not found' };
    }
    if (/user_id|profiles/.test(text)) {
      // mood_entries and song_feedback reference profiles: no profile means onboarding is unfinished
      return { status: 404, code: ERROR_CODES.PROFILE_NOT_FOUND, message: 'Finish onboarding first' };
    }
    return { status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Referenced record not found' };
  }

  if (err.code === PG_INVALID_TEXT) {
    return { status: 400, code: ERROR_CODES.VALIDATION_ERROR, message: 'A field has an invalid format' };
  }

  return null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const known = classifyError(err);
  if (known) {
    return send(res, known.status, known.code, known.message);
  }

  console.error('Unhandled server error:', err);
  return send(res, 500, ERROR_CODES.INTERNAL_ERROR, 'An unexpected internal error occurred');
}

module.exports = {
  notFound,
  errorHandler,
  classifyError,
};
