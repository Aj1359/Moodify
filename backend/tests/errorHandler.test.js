const test = require('node:test');
const assert = require('node:assert/strict');

const { errorHandler, notFound, classifyError } = require('../src/middlewares/errorHandler');

/** Minimal Express response double that records status and body. */
const fakeRes = () => ({
  statusCode: null,
  body: null,
  headersSent: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

// Error objects shaped like the ones supabase-js returns from PostgREST
const songFkError = {
  code: '23503',
  message: 'insert or update on table "song_feedback" violates foreign key constraint "song_feedback_song_id_fkey"',
  details: 'Key (song_id)=(00000000-0000-4000-8000-000000000000) is not present in table "songs".',
};
const profileFkError = {
  code: '23503',
  message: 'insert or update on table "mood_entries" violates foreign key constraint "mood_entries_user_id_fkey"',
  details: 'Key (user_id)=(11111111-1111-4111-8111-111111111111) is not present in table "profiles".',
};

test('an unknown song id becomes 404 NOT_FOUND', () => {
  assert.deepEqual(classifyError(songFkError), { status: 404, code: 'NOT_FOUND', message: 'Song not found' });
});

test('a missing profile becomes 404 PROFILE_NOT_FOUND so the app opens onboarding', () => {
  const r = classifyError(profileFkError);
  assert.equal(r.status, 404);
  assert.equal(r.code, 'PROFILE_NOT_FOUND');
});

test('body-parser failures are client errors', () => {
  assert.equal(classifyError({ type: 'entity.parse.failed' }).status, 400);
  assert.equal(classifyError({ type: 'entity.too.large' }).status, 413);
});

test('unknown errors become a 500 without leaking the message', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = fakeRes();
  errorHandler(new Error('connection string postgres://secret@db'), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, 'INTERNAL_ERROR');
  assert.ok(!JSON.stringify(res.body).includes('secret'));
});

test('known errors go through the handler with their contract code', () => {
  const res = fakeRes();
  errorHandler(songFkError, {}, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: { code: 'NOT_FOUND', message: 'Song not found' } });
});

test('errors after headers are sent are passed on to Express', () => {
  const res = { ...fakeRes(), headersSent: true };
  let forwarded = null;
  errorHandler(songFkError, {}, res, (err) => {
    forwarded = err;
  });
  assert.equal(forwarded, songFkError);
});

test('notFound names the method and path', () => {
  const res = fakeRes();
  notFound({ method: 'GET', path: '/api/nope' }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.message, 'No route for GET /api/nope');
});
