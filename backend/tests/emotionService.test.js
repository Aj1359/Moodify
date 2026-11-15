const test = require('node:test');
const assert = require('node:assert/strict');

const { analyzeMood } = require('../src/services/emotionService');
const { MOODS, LEVELS } = require('../src/config/constants');

test('emotionService: returns contract shape via keyword fallback when LLM_API_KEY is not set', async () => {
  const result = await analyzeMood('aaj bahut thak gaya hu, need some chill music');
  assert.ok(result, 'result should exist');
  assert.equal(result.source, 'keyword');
  assert.ok(LEVELS.includes(result.energy));
  assert.ok(LEVELS.includes(result.intensity));
  assert.equal(typeof result.emotion, 'string');
  assert.equal(typeof result.context, 'string');
  assert.ok(result.targetMoods.length >= 1 && result.targetMoods.length <= 3);
  for (const m of result.targetMoods) {
    assert.ok(MOODS.includes(m), `Valid mood: ${m}`);
  }
});

test('emotionService: handles empty or generic text safely without crashing', async () => {
  const result = await analyzeMood('just play something');
  assert.ok(result, 'result should exist');
  assert.equal(result.source, 'keyword');
  assert.equal(result.targetMoods[0], 'Relaxed');
});


// ---------------------------------------------------------------------------
// LLM path with a mocked Gemini response (no network, no real key)
// ---------------------------------------------------------------------------

const geminiReply = (text, { ok = true, status = 200 } = {}) => async () => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

const withKey = (t) => {
  const saved = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = 'test-key';
  t.after(() => {
    if (saved === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = saved;
  });
  t.mock.method(console, 'warn', () => {});
};

test('emotionService: a valid Gemini answer is returned with source "llm"', async (t) => {
  withKey(t);
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    geminiReply('{"emotion":"exhaustion","energy":"low","intensity":"medium","context":"work","targetMoods":["Relaxed","Sad"]}')
  );

  const result = await analyzeMood('office ne nichod diya aaj');
  assert.deepEqual(result, {
    emotion: 'exhaustion',
    energy: 'low',
    intensity: 'medium',
    context: 'work',
    targetMoods: ['Relaxed', 'Sad'],
    source: 'llm',
  });

  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.ok(!url.includes('test-key'), 'the API key must not be in the URL');
  assert.equal(init.headers['x-goog-api-key'], 'test-key');
});

test('emotionService: fenced JSON and lower-case moods are still accepted', async (t) => {
  withKey(t);
  t.mock.method(
    globalThis,
    'fetch',
    geminiReply('```json\n{"emotion":"joy","energy":"High","intensity":"high","context":"celebration","targetMoods":["happy"]}\n```')
  );
  const result = await analyzeMood('placement ho gaya!!');
  assert.equal(result.source, 'llm');
  assert.deepEqual(result.targetMoods, ['Happy']);
  assert.equal(result.energy, 'high');
});

test('emotionService: falls back to keywords on an HTTP error, bad JSON, an unknown mood or a network failure', async (t) => {
  withKey(t);
  const text = 'bahut gussa aa raha hai';
  const cases = [
    geminiReply('{}', { ok: false, status: 429 }),
    geminiReply('not json at all'),
    geminiReply('{"emotion":"x","energy":"low","intensity":"low","context":"y","targetMoods":["Confused"]}'),
    async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    },
  ];
  for (const impl of cases) {
    t.mock.method(globalThis, 'fetch', impl);
    const result = await analyzeMood(text);
    assert.equal(result.source, 'keyword');
    assert.equal(result.targetMoods[0], 'Angry');
    t.mock.restoreAll();
    t.mock.method(console, 'warn', () => {});
  }
});

test('emotionService: thinking is switched off for Gemini 2.5 Flash only', async (t) => {
  const { supportsThinkingOff } = require('../src/services/emotionService');
  assert.equal(supportsThinkingOff('gemini-2.5-flash'), true);
  assert.equal(supportsThinkingOff('gemini-2.5-flash-lite'), true);
  assert.equal(supportsThinkingOff('gemini-2.5-pro'), false);
  assert.equal(supportsThinkingOff('gemini-1.5-flash'), false);

  withKey(t);
  const savedModel = process.env.LLM_MODEL;
  process.env.LLM_MODEL = 'gemini-2.5-flash';
  t.after(() => {
    if (savedModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = savedModel;
  });
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    geminiReply('{"emotion":"joy","energy":"high","intensity":"high","context":"general","targetMoods":["Happy"]}')
  );
  await analyzeMood('so happy today');
  const body = JSON.parse(fetchMock.mock.calls[0].arguments[1].body);
  assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingBudget: 0 });
});

test('emotionService: the default model is gemini-3.5-flash-lite, sent without a thinking config', async (t) => {
  withKey(t);
  const savedModel = process.env.LLM_MODEL;
  delete process.env.LLM_MODEL;
  t.after(() => {
    if (savedModel !== undefined) process.env.LLM_MODEL = savedModel;
  });
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    geminiReply('{"emotion":"joy","energy":"high","intensity":"high","context":"general","targetMoods":["Happy"]}')
  );
  await analyzeMood('so happy today');
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.ok(url.includes('/models/gemini-3.5-flash-lite:generateContent'));
  assert.equal(JSON.parse(init.body).generationConfig.thinkingConfig, undefined);
});
