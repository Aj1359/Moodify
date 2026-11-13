/**
 * Request validation for every endpoint in the API contract (README 6.3).
 *
 * Usage in a route file:
 *   const { validate } = require('../middlewares/validate');
 *   router.post('/analyze', validate('analyzeMood'), controller.analyze);
 *
 * On success the cleaned values are on req.valid.body / req.valid.query /
 * req.valid.params: strings trimmed, numbers parsed, defaults filled and
 * unknown fields dropped. Handlers read from req.valid, never from req.body.
 * On failure it answers 400 with the standard error envelope:
 *   { "error": { "code": "VALIDATION_ERROR", "message": "..." } }
 */
const {
  MOODS,
  LEVELS,
  SONG_LANGUAGES,
  LANGUAGE_FILTERS,
  FEEDBACK_TYPES,
  ANALYSIS_SOURCES,
  LIMITS,
  ERROR_CODES,
} = require('../config/constants');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class FieldError extends Error {}

const fail = (message) => {
  throw new FieldError(message);
};

// ---------------------------------------------------------------------------
// Field rules. Each rule is (value, name) -> cleaned value, or throws.
// ---------------------------------------------------------------------------

const optional = (rule, fallback) => (value, name) =>
  value === undefined || value === null || value === '' ? fallback : rule(value, name);

const string = ({ min = 1, max = 200 } = {}) => (value, name) => {
  if (typeof value !== 'string') fail(`${name} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) fail(`${name} must be ${min}-${max} characters`);
  return trimmed;
};

const oneOf = (allowed) => (value, name) => {
  if (!allowed.includes(value)) fail(`${name} must be one of: ${allowed.join(', ')}`);
  return value;
};

const integer = ({ min, max }) => (value, name) => {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < min || n > max) fail(`${name} must be a whole number from ${min} to ${max}`);
  return n;
};

const uuid = () => (value, name) => {
  if (typeof value !== 'string' || !UUID_RE.test(value)) fail(`${name} must be a UUID`);
  return value.toLowerCase();
};

const uuidOr = (literal) => (value, name) => {
  if (value === literal) return value;
  if (typeof value !== 'string' || !UUID_RE.test(value)) fail(`${name} must be a UUID or "${literal}"`);
  return value.toLowerCase();
};

const arrayOf = (rule, { min = 0, max = 20, unique = true } = {}) => (value, name) => {
  if (!Array.isArray(value)) fail(`${name} must be an array`);
  if (value.length < min || value.length > max) fail(`${name} must have ${min}-${max} items`);
  const cleaned = value.map((item, i) => rule(item, `${name}[${i}]`));
  if (unique && new Set(cleaned).size !== cleaned.length) fail(`${name} must not repeat values`);
  return cleaned;
};

const object = (shape) => (value, name) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${name} must be an object`);
  return checkShape(shape, value, name);
};

function checkShape(shape, input, prefix) {
  const source = input && typeof input === 'object' ? input : {};
  const out = {};
  for (const [key, rule] of Object.entries(shape)) {
    const name = prefix ? `${prefix}.${key}` : key;
    const value = rule(source[key], name);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

const required = (rule) => (value, name) => {
  if (value === undefined || value === null) fail(`${name} is required`);
  return rule(value, name);
};

// ---------------------------------------------------------------------------
// Shapes shared by several endpoints
// ---------------------------------------------------------------------------

const moodText = required(string({ min: 1, max: LIMITS.MOOD_TEXT_MAX }));
const mood = required(oneOf(MOODS));

const analysisShape = {
  emotion: required(string({ min: 1, max: 50 })),
  energy: required(oneOf(LEVELS)),
  intensity: required(oneOf(LEVELS)),
  context: required(string({ min: 1, max: 50 })),
  targetMoods: required(arrayOf(oneOf(MOODS), { min: 1, max: LIMITS.TARGET_MOODS_MAX })),
  source: required(oneOf(ANALYSIS_SOURCES)),
};

// ---------------------------------------------------------------------------
// One schema per endpoint
// ---------------------------------------------------------------------------

const SCHEMAS = {
  /** POST /mood/analyze */
  analyzeMood: {
    body: { text: moodText },
  },
  /** POST /mood/confirm */
  confirmMood: {
    body: {
      text: moodText,
      confirmedMood: mood,
      analysis: required(object(analysisShape)),
    },
  },
  /** GET /mood/history */
  moodHistory: {
    query: {
      limit: optional(integer({ min: 1, max: LIMITS.HISTORY_MAX }), LIMITS.HISTORY_DEFAULT),
    },
  },
  /** DELETE /mood/:id */
  deleteMood: {
    params: { id: required(uuidOr('all')) },
  },
  /** PUT /preferences */
  updatePreferences: {
    body: {
      name: required(string({ min: 1, max: 60 })),
      preferredLanguages: required(arrayOf(oneOf(SONG_LANGUAGES), { min: 1, max: SONG_LANGUAGES.length })),
      genres: required(arrayOf(string({ min: 1, max: 40 }), { min: 0, max: 20 })),
    },
  },
  /** GET /recommendations */
  recommendations: {
    query: {
      mood,
      language: optional(oneOf(LANGUAGE_FILTERS), undefined),
      limit: optional(
        integer({ min: 1, max: LIMITS.RECOMMENDATIONS_MAX }),
        LIMITS.RECOMMENDATIONS_DEFAULT
      ),
    },
  },
  /** POST /feedback */
  feedback: {
    body: {
      songId: required(uuid()),
      type: required(oneOf(FEEDBACK_TYPES)),
    },
  },
};

/**
 * Express middleware for one endpoint schema.
 * @param {keyof typeof SCHEMAS} schemaName
 */
function validate(schemaName) {
  const schema = SCHEMAS[schemaName];
  if (!schema) throw new Error(`Unknown validation schema "${schemaName}"`);

  return function validateRequest(req, res, next) {
    try {
      req.valid = {};
      for (const part of ['params', 'query', 'body']) {
        if (schema[part]) req.valid[part] = checkShape(schema[part], req[part], '');
      }
      return next();
    } catch (err) {
      if (!(err instanceof FieldError)) return next(err);
      return res.status(400).json({
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: err.message },
      });
    }
  };
}

module.exports = { validate, SCHEMAS, UUID_RE };
