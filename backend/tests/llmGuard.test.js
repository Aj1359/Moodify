const test = require('node:test');
const assert = require('node:assert/strict');

const llmGuard = require('../src/services/llmGuard');
const { analyzeMood } = require('../src/services/emotionService');

const ANSWER = { emotion: 'joy', energy: 'high', intensity: 'high', context: 'general', targetMoods: ['Happy'], source: 'llm' };

test.beforeEach(() => llmGuard.reset());

test('cache: the same text (any case or spacing) is reused for 10 minutes', () => {
  const t0 = 1_000_000;
  llmGuard.remember('Aaj bahut  khush hu', ANSWER, t0);
  assert.deepEqual(llmGuard.getCached('aaj bahut khush hu', t0 + 60_000), ANSWER);
  assert.equal(llmGuard.getCached('aaj bahut khush hu', t0 + 10 * 60_000 + 1), null);
});

test('cache: callers get a copy, so changing it does not change the cache', () => {
  llmGuard.remember('so happy', ANSWER);
  llmGuard.getCached('so happy').targetMoods.push('Sad');
  assert.deepEqual(llmGuard.getCached('so happy').targetMoods, ['Happy']);
});

test('per-user limit: 10 calls a minute by default, then allowed again', () => {
  const t0 = 2_000_000;
  for (let i = 0; i < 10; i += 1) assert.equal(llmGuard.reserve('user-a', t0 + i).allowed, true);
  assert.deepEqual(llmGuard.reserve('user-a', t0 + 10), { allowed: false, reason: 'per-user limit' });
  assert.equal(llmGuard.reserve('user-b', t0 + 10).allowed, true, 'other users are not affected');
  assert.equal(llmGuard.reserve('user-a', t0 + 60_001).allowed, true);
});

test('daily cap: counts every call and resets on a new UTC day', (t) => {
  process.env.LLM_DAILY_LIMIT = '3';
  t.after(() => delete process.env.LLM_DAILY_LIMIT);
  const day1 = Date.UTC(2026, 10, 16, 10);
  for (let i = 0; i < 3; i += 1) assert.equal(llmGuard.reserve(undefined, day1).allowed, true);
  assert.deepEqual(llmGuard.reserve(undefined, day1), { allowed: false, reason: 'daily limit' });
  assert.equal(llmGuard.reserve(undefined, Date.UTC(2026, 10, 17, 0, 0, 1)).allowed, true);
});

test('analyzeMood: over the limit it answers from keywords without calling Gemini', async (t) => {
  const saved = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = 'test-key';
  process.env.LLM_DAILY_LIMIT = '0';
  t.after(() => {
    delete process.env.LLM_DAILY_LIMIT;
    if (saved === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = saved;
  });
  t.mock.method(console, 'warn', () => {});
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('must not be called');
  });

  const result = await analyzeMood('bahut gussa aa raha hai', { userId: 'u1' });
  assert.equal(result.source, 'keyword');
  assert.equal(result.targetMoods[0], 'Angry');
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('analyzeMood: a repeated text is served from the cache with one Gemini call', async (t) => {
  const saved = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = 'test-key';
  t.after(() => {
    if (saved === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = saved;
  });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      candidates: [{ content: { parts: [{ text: '{"emotion":"joy","energy":"high","intensity":"high","context":"general","targetMoods":["Happy"]}' }] } }],
    }),
  }));

  const first = await analyzeMood('placement ho gaya!!', { userId: 'u1' });
  const second = await analyzeMood('Placement ho gaya!! ', { userId: 'u2' });
  assert.equal(first.source, 'llm');
  assert.deepEqual(second, first);
  assert.equal(fetchMock.mock.callCount(), 1);
});
