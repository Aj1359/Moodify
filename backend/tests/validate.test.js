const test = require('node:test');
const assert = require('node:assert/strict');

const { validate } = require('../src/middlewares/validate');

const SONG_ID = 'c2771016-ab21-54ff-885d-63f8038fa64d';
const ANALYSIS = {
  emotion: 'exhaustion',
  energy: 'low',
  intensity: 'high',
  context: 'work',
  targetMoods: ['Relaxed', 'Stressed'],
  source: 'llm',
};

/** Runs the middleware on a fake request; resolves to { passed, req, status, body }. */
function run(schemaName, { body, query, params } = {}) {
  const req = { body: body ?? {}, query: query ?? {}, params: params ?? {} };
  const result = { passed: false, req, status: null, body: null };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    json(payload) {
      result.body = payload;
      return this;
    },
  };
  validate(schemaName)(req, res, (err) => {
    if (err) throw err;
    result.passed = true;
  });
  return result;
}

const rejects = (schemaName, input, messagePart) => {
  const result = run(schemaName, input);
  assert.equal(result.passed, false);
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
  if (messagePart) assert.match(result.body.error.message, new RegExp(messagePart));
};

test('unknown schema names fail at startup', () => {
  assert.throws(() => validate('nope'), /Unknown validation schema/);
});

test('analyzeMood trims text and enforces 1-500 characters', () => {
  const ok = run('analyzeMood', { body: { text: '  bahut stress hai  ', extra: 'dropped' } });
  assert.equal(ok.passed, true);
  assert.deepEqual(ok.req.valid.body, { text: 'bahut stress hai' });

  rejects('analyzeMood', { body: {} }, 'text is required');
  rejects('analyzeMood', { body: { text: '   ' } }, '1-500');
  rejects('analyzeMood', { body: { text: 'x'.repeat(501) } }, '1-500');
  rejects('analyzeMood', { body: { text: 42 } }, 'string');
});

test('confirmMood checks the mood and the analysis object', () => {
  const ok = run('confirmMood', { body: { text: 'thak gaya', confirmedMood: 'Relaxed', analysis: ANALYSIS } });
  assert.equal(ok.passed, true);
  assert.deepEqual(ok.req.valid.body.analysis, ANALYSIS);

  rejects('confirmMood', { body: { text: 'x', confirmedMood: 'relaxed', analysis: ANALYSIS } }, 'confirmedMood');
  rejects('confirmMood', { body: { text: 'x', confirmedMood: 'Relaxed' } }, 'analysis is required');
  rejects(
    'confirmMood',
    { body: { text: 'x', confirmedMood: 'Relaxed', analysis: { ...ANALYSIS, targetMoods: [] } } },
    'analysis.targetMoods'
  );
  rejects(
    'confirmMood',
    { body: { text: 'x', confirmedMood: 'Relaxed', analysis: { ...ANALYSIS, source: 'gpt' } } },
    'analysis.source'
  );
});

test('moodHistory parses limit and applies the default', () => {
  assert.equal(run('moodHistory').req.valid.query.limit, 20);
  assert.equal(run('moodHistory', { query: { limit: '5' } }).req.valid.query.limit, 5);
  rejects('moodHistory', { query: { limit: '0' } }, 'limit');
  rejects('moodHistory', { query: { limit: '101' } }, 'limit');
  rejects('moodHistory', { query: { limit: 'ten' } }, 'limit');
});

test('deleteMood accepts a UUID or "all"', () => {
  assert.equal(run('deleteMood', { params: { id: 'all' } }).passed, true);
  assert.equal(run('deleteMood', { params: { id: SONG_ID.toUpperCase() } }).req.valid.params.id, SONG_ID);
  rejects('deleteMood', { params: { id: '123' } }, 'UUID');
});

test('updatePreferences checks languages and genres', () => {
  const body = { name: ' Aditi ', preferredLanguages: ['Hindi'], genres: ['Lo-Fi', 'Bollywood'] };
  assert.deepEqual(run('updatePreferences', { body }).req.valid.body, { ...body, name: 'Aditi' });
  rejects('updatePreferences', { body: { ...body, preferredLanguages: [] } }, 'preferredLanguages');
  rejects('updatePreferences', { body: { ...body, preferredLanguages: ['Tamil'] } }, 'preferredLanguages');
  rejects('updatePreferences', { body: { ...body, preferredLanguages: ['Hindi', 'Hindi'] } }, 'repeat');
  rejects('updatePreferences', { body: { ...body, genres: 'Lo-Fi' } }, 'genres');
});

test('recommendations requires a mood and defaults the limit', () => {
  const ok = run('recommendations', { query: { mood: 'Relaxed', language: 'Both' } });
  assert.deepEqual(ok.req.valid.query, { mood: 'Relaxed', language: 'Both', limit: 10 });
  assert.deepEqual(run('recommendations', { query: { mood: 'Sad' } }).req.valid.query, { mood: 'Sad', limit: 10 });
  rejects('recommendations', { query: {} }, 'mood is required');
  rejects('recommendations', { query: { mood: 'Relaxed', language: 'Tamil' } }, 'language');
  rejects('recommendations', { query: { mood: 'Relaxed', limit: '50' } }, 'limit');
});

test('feedback requires a song UUID and a known type', () => {
  assert.equal(run('feedback', { body: { songId: SONG_ID, type: 'like' } }).passed, true);
  rejects('feedback', { body: { songId: 'h-01', type: 'like' } }, 'songId');
  rejects('feedback', { body: { songId: SONG_ID, type: 'love' } }, 'type');
});
