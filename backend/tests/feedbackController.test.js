/**
 * Feedback endpoints against a stubbed Supabase client (no network).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const supabaseModule = require('../src/config/supabase');
const { postFeedback, getLikedSongs } = require('../src/controllers/feedbackController');
const { errorHandler } = require('../src/middlewares/errorHandler');

const USER = '11111111-1111-4111-8111-111111111111';
const SONG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SONG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/**
 * A chainable query double: every builder method records its call and returns
 * the same object; awaiting it resolves to the result set for that table.
 */
function stubSupabase(t, resultsByTable) {
  const calls = [];
  const builder = (table) => {
    const q = new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === 'then') {
            const result = resultsByTable[table];
            return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
          }
          return (...args) => {
            calls.push({ table, method: prop, args });
            return q;
          };
        },
      }
    );
    return q;
  };
  t.mock.method(supabaseModule.supabase, 'from', builder);
  return calls;
}

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

test('POST /feedback upserts one row per user and song and refreshes its timestamp', async (t) => {
  const calls = stubSupabase(t, {
    song_feedback: { data: { user_id: USER, song_id: SONG_A, type: 'like' }, error: null },
  });
  const before = Date.now();
  const res = fakeRes();

  await postFeedback({ user: { id: USER }, valid: { body: { songId: SONG_A, type: 'like' } } }, res, assert.ifError);

  const upsert = calls.find((c) => c.method === 'upsert');
  const [row, options] = upsert.args;
  assert.equal(row.user_id, USER);
  assert.equal(row.song_id, SONG_A);
  assert.equal(row.type, 'like');
  assert.ok(Date.parse(row.created_at) >= before - 1000, 'a repeat tap must move the like to the top');
  assert.equal(options.onConflict, 'user_id,song_id');

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { data: { songId: SONG_A, type: 'like' } });
});

test('POST /feedback with an unknown song ends as 404 NOT_FOUND', async (t) => {
  stubSupabase(t, {
    song_feedback: {
      data: null,
      error: { code: '23503', message: 'violates foreign key constraint', details: 'Key (song_id)=(x) is not present in table "songs".' },
    },
  });
  const res = fakeRes();
  let forwarded = null;

  await postFeedback({ user: { id: USER }, valid: { body: { songId: SONG_A, type: 'like' } } }, res, (err) => {
    forwarded = err;
  });
  assert.ok(forwarded, 'the database error is passed to the error handler');

  errorHandler(forwarded, {}, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('GET /feedback/liked keeps newest-like-first order and returns contract songs', async (t) => {
  const songRow = (id, title) => ({
    id,
    title,
    artist: 'Artist',
    language: 'Hindi',
    genre: 'Pop',
    moods: ['Happy'],
    energy: 'high',
    url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
    created_at: '2026-11-10T00:00:00Z',
  });
  stubSupabase(t, {
    // newest like first, as the query orders it
    song_feedback: { data: [{ song_id: SONG_B }, { song_id: SONG_A }], error: null },
    // the songs query returns rows in an unrelated order
    songs: { data: [songRow(SONG_A, 'A'), songRow(SONG_B, 'B')], error: null },
  });
  const res = fakeRes();

  await getLikedSongs({ user: { id: USER } }, res, assert.ifError);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    res.body.data.songs.map((s) => s.title),
    ['B', 'A']
  );
  assert.ok(!('created_at' in res.body.data.songs[0]), 'songs are camelCase contract objects');
});

test('GET /feedback/liked with no likes returns an empty list', async (t) => {
  stubSupabase(t, { song_feedback: { data: [], error: null } });
  const res = fakeRes();
  await getLikedSongs({ user: { id: USER } }, res, assert.ifError);
  assert.deepEqual(res.body, { data: { songs: [] } });
});
