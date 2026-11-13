/**
 * The single translation layer between database rows (snake_case) and API
 * objects (camelCase). README 6.1: no other file converts key styles.
 *
 * - rowToX(row)  : database row -> API object with exactly the contract fields
 * - xToRow(obj)  : API object   -> database row for insert/update
 * - toCamel/toSnake : generic deep converters for anything else
 */

const toCamelKey = (key) => key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnakeKey = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

function convertKeys(value, convert) {
  if (Array.isArray(value)) return value.map((item) => convertKeys(item, convert));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [convert(k), convertKeys(v, convert)]));
}

/** Deep-convert object keys to camelCase. Values are left untouched. */
const toCamel = (value) => convertKeys(value, toCamelKey);

/** Deep-convert object keys to snake_case. Values are left untouched. */
const toSnake = (value) => convertKeys(value, toSnakeKey);

const toIso = (value) => (value instanceof Date ? value.toISOString() : value ?? null);

// ---------------------------------------------------------------------------
// Rows -> API objects (field lists match mobile/src/types/index.ts)
// ---------------------------------------------------------------------------

/** profiles row -> UserProfile */
function rowToProfile(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    name: row.name ?? '',
    preferredLanguages: row.preferred_languages ?? [],
    genres: row.genres ?? [],
  };
}

/** songs row -> Song. Pass { score, reason } from the scorer when ranking. */
function rowToSong(row, extra = {}) {
  if (!row) return null;
  const song = {
    id: row.id,
    title: row.title,
    artist: row.artist,
    language: row.language,
    genre: row.genre,
    moods: row.moods ?? [],
    energy: row.energy,
    url: row.url,
  };
  if (extra.score !== undefined) song.score = extra.score;
  if (extra.reason !== undefined) song.reason = extra.reason;
  return song;
}

/** mood_entries row -> MoodEntry */
function rowToMoodEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    inputText: row.input_text,
    emotion: row.emotion,
    energy: row.energy,
    intensity: row.intensity,
    confirmedMood: row.confirmed_mood,
    createdAt: toIso(row.created_at),
  };
}

/** song_feedback row -> FeedbackResponse */
function rowToFeedback(row) {
  if (!row) return null;
  return { songId: row.song_id, type: row.type };
}

// ---------------------------------------------------------------------------
// API objects -> rows
// ---------------------------------------------------------------------------

/** PUT /preferences body + user id -> profiles row (upsert) */
function preferencesToRow(userId, { name, preferredLanguages, genres }) {
  return {
    user_id: userId,
    name,
    preferred_languages: preferredLanguages,
    genres,
    updated_at: new Date().toISOString(),
  };
}

/** POST /mood/confirm body + user id -> mood_entries row */
function confirmToMoodEntryRow(userId, { text, confirmedMood, analysis }) {
  return {
    user_id: userId,
    input_text: text,
    emotion: analysis.emotion,
    energy: analysis.energy,
    intensity: analysis.intensity,
    confirmed_mood: confirmedMood,
  };
}

/** POST /feedback body + user id -> song_feedback row (upsert on user_id, song_id) */
function feedbackToRow(userId, { songId, type }) {
  return { user_id: userId, song_id: songId, type };
}

/** Seed file song (already camelCase-compatible) -> songs row */
function seedSongToRow(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    language: song.language,
    genre: song.genre,
    moods: song.moods,
    energy: song.energy,
    url: song.url,
  };
}

module.exports = {
  toCamel,
  toSnake,
  rowToProfile,
  rowToSong,
  rowToMoodEntry,
  rowToFeedback,
  preferencesToRow,
  confirmToMoodEntryRow,
  feedbackToRow,
  seedSongToRow,
};
