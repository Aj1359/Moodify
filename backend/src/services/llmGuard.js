/**
 * Protects the Gemini quota (free tier: 500 requests per day per model).
 *
 * Before each LLM call, emotionService asks the guard whether to call Gemini:
 * - Cache: the same text (after trimming and lowercasing) within 10 minutes
 *   reuses the earlier LLM answer instead of calling again.
 * - Per-user limit: at most LLM_USER_PER_MINUTE calls per user per minute (default 10).
 * - Daily cap: at most LLM_DAILY_LIMIT calls per server per UTC day (default 450,
 *   leaving headroom under the 500 free requests for manual checks).
 *
 * When a limit is reached the caller uses the keyword fallback, which the contract
 * already allows ("source": "keyword"), so the app never sees an error.
 * State is in memory: it resets when the server restarts, which is fine for one instance.
 */

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const MINUTE_MS = 60 * 1000;

const intFromEnv = (name, fallback) => {
  const n = Number.parseInt(process.env[name], 10);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
};

const cache = new Map(); // key -> { value, expires }
const userCalls = new Map(); // userId -> timestamps (ms) of calls in the last minute
let day = null;
let dailyCount = 0;

const cacheKey = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ');
const utcDay = (now) => new Date(now).toISOString().slice(0, 10);

/**
 * A cached LLM answer for this text, or null.
 * @param {string} text
 * @param {number} [now]
 */
function getCached(text, now = Date.now()) {
  const key = cacheKey(text);
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires <= now) {
    cache.delete(key);
    return null;
  }
  return { ...hit.value, targetMoods: [...hit.value.targetMoods] };
}

/**
 * Remember an LLM answer for this text.
 * @param {string} text
 * @param {object} value - a validated MoodAnalysisResult with source 'llm'
 * @param {number} [now]
 */
function remember(text, value, now = Date.now()) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Map keeps insertion order: drop the oldest entry
    cache.delete(cache.keys().next().value);
  }
  cache.set(cacheKey(text), { value, expires: now + CACHE_TTL_MS });
}

/**
 * Reserve one LLM call. Returns { allowed: true } and counts the call, or
 * { allowed: false, reason } when a limit is reached.
 * @param {string|undefined} userId - omitted for scripts such as the evaluation harness
 * @param {number} [now]
 */
function reserve(userId, now = Date.now()) {
  const today = utcDay(now);
  if (today !== day) {
    day = today;
    dailyCount = 0;
  }
  if (dailyCount >= intFromEnv('LLM_DAILY_LIMIT', 450)) {
    return { allowed: false, reason: 'daily limit' };
  }

  if (userId) {
    const recent = (userCalls.get(userId) || []).filter((t) => now - t < MINUTE_MS);
    if (recent.length >= intFromEnv('LLM_USER_PER_MINUTE', 10)) {
      userCalls.set(userId, recent);
      return { allowed: false, reason: 'per-user limit' };
    }
    recent.push(now);
    userCalls.set(userId, recent);
  }

  dailyCount += 1;
  return { allowed: true };
}

/** Clear all state (tests). */
function reset() {
  cache.clear();
  userCalls.clear();
  day = null;
  dailyCount = 0;
}

/** Counters for logs and tests. */
function stats() {
  return { day, dailyCount, cached: cache.size };
}

module.exports = { getCached, remember, reserve, reset, stats };
