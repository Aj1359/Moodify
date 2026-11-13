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

