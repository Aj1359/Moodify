/**
 * Shared constants for the API contract (README section 6.1).
 * Import these instead of retyping the values, so the backend has one
 * definition of every allowed value.
 */

const MOODS = Object.freeze([
  'Happy',
  'Sad',
  'Angry',
  'Stressed',
  'Relaxed',
  'Motivated',
  'Romantic',
  'Nostalgic',
]);

const LEVELS = Object.freeze(['low', 'medium', 'high']);

const SONG_LANGUAGES = Object.freeze(['Hindi', 'English']);
const LANGUAGE_FILTERS = Object.freeze(['Hindi', 'English', 'Both']);

const FEEDBACK_TYPES = Object.freeze(['like', 'dislike', 'skip']);

const ANALYSIS_SOURCES = Object.freeze(['llm', 'keyword']);
const RECOMMENDATION_SOURCES = Object.freeze(['db', 'fallback']);

/** Typical energy of music for each mood (README section 3). */
const MOOD_ENERGY = Object.freeze({
  Happy: 'high',
  Sad: 'low',
  Angry: 'high',
  Stressed: 'medium',
  Relaxed: 'low',
  Motivated: 'high',
  Romantic: 'medium',
  Nostalgic: 'medium',
});

/** What the keyword fallback returns when nothing in the text matches. */
const DEFAULT_ANALYSIS = Object.freeze({
  emotion: 'neutral',
  energy: 'medium',
  intensity: 'low',
  context: 'general',
  targetMoods: Object.freeze(['Relaxed']),
  source: 'keyword',
});

const LIMITS = Object.freeze({
  MOOD_TEXT_MAX: 500,
  TARGET_MOODS_MAX: 3,
  HISTORY_DEFAULT: 20,
  HISTORY_MAX: 100,
  RECOMMENDATIONS_DEFAULT: 10,
  RECOMMENDATIONS_MAX: 20,
  LLM_TIMEOUT_MS: 3000,
});

const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

module.exports = {
  MOODS,
  LEVELS,
  SONG_LANGUAGES,
  LANGUAGE_FILTERS,
  FEEDBACK_TYPES,
  ANALYSIS_SOURCES,
  RECOMMENDATION_SOURCES,
  MOOD_ENERGY,
  DEFAULT_ANALYSIS,
  LIMITS,
  ERROR_CODES,
};
