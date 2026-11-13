const test = require('node:test');
const assert = require('node:assert/strict');

const { keywordFallback, explainKeywords, normalize } = require('../src/services/keywordFallback');
const { MOODS, LEVELS, DEFAULT_ANALYSIS } = require('../src/config/constants');

const top = (text) => keywordFallback(text).targetMoods[0];

test('returns the contract shape with source "keyword"', () => {
  const result = keywordFallback('feeling so happy today');
  assert.deepEqual(Object.keys(result).sort(), ['context', 'emotion', 'energy', 'intensity', 'source', 'targetMoods']);
  assert.equal(result.source, 'keyword');
  assert.ok(LEVELS.includes(result.energy));
  assert.ok(LEVELS.includes(result.intensity));
  assert.ok(result.targetMoods.length >= 1 && result.targetMoods.length <= 3);
  for (const mood of result.targetMoods) assert.ok(MOODS.includes(mood));
});

test('falls back to the default analysis when nothing matches', () => {
  for (const input of ['', '   ', 'asdf qwerty', null, undefined, 42]) {
    assert.deepEqual(keywordFallback(input), { ...DEFAULT_ANALYSIS, targetMoods: ['Relaxed'] });
  }
});

test('detects English moods', () => {
  assert.equal(top('I am so happy, got placed today'), 'Happy');
  assert.equal(top('feeling really lonely and sad tonight'), 'Sad');
  assert.equal(top('my manager is so annoying, I am furious'), 'Angry');
  assert.equal(top('exam tomorrow and I am super anxious'), 'Stressed');
  assert.equal(top('just want to chill with some lofi'), 'Relaxed');
  assert.equal(top('gym time, lets go beast mode'), 'Motivated');
  assert.equal(top('date night with my girlfriend'), 'Romantic');
  assert.equal(top('remembering my childhood summers'), 'Nostalgic');
});

test('detects Romanised Hinglish moods, including spelling variants', () => {
  assert.equal(top('aaj bahut khush hu yaar'), 'Happy');
  assert.equal(top('bohot udaas lag raha hai'), 'Sad');
  assert.equal(top('itna gussa aa raha hai'), 'Angry');
  assert.equal(top('bahut tension ho rahi hai kal ke exam ki'), 'Stressed');
  assert.equal(top('aaj bahut thak gaya hu, kuch relax wala sunna hai'), 'Relaxed');
  assert.equal(top('aaj kuch kar dikhana hai, full josh'), 'Motivated');
  assert.equal(top('uske saath date pe jaa raha hu'), 'Romantic');
  assert.equal(top('bachpan ke din yaad aa gaye'), 'Nostalgic');
});

test('handles negation in English and Hinglish', () => {
  assert.equal(top('I am not happy at all'), 'Sad');
  assert.equal(top('khush nahi hu'), 'Sad');
  assert.equal(top('no tension, just chilling'), 'Relaxed');
  // a negator inside another phrase must not negate a neighbouring cue
  assert.ok(keywordFallback('mann nahi lag raha').targetMoods.includes('Sad'));
});

test('negation does not cross a clause boundary', () => {
  const result = keywordFallback('not tired, but really excited for the trip');
  assert.equal(result.targetMoods[0], 'Happy');
});

test('elongated words, intensifiers and diminishers set intensity', () => {
  assert.equal(keywordFallback('sooo happyyyy').intensity, 'high');
  assert.equal(keywordFallback('bahut stress hai').intensity, 'high');
  assert.equal(keywordFallback('thoda udaas hu').intensity, 'low');
  assert.equal(keywordFallback('I am sad').intensity, 'medium');
});

test('emoji cues count', () => {
  assert.equal(top('😭😭'), 'Sad');
  assert.equal(top('gym 💪'), 'Motivated');
  assert.equal(top('❤️'), 'Romantic');
});

test('exhaustion maps to Relaxed with low energy and emotion "exhaustion"', () => {
  const result = keywordFallback('so tired after work');
  assert.equal(result.targetMoods[0], 'Relaxed');
  assert.equal(result.emotion, 'exhaustion');
  assert.equal(result.energy, 'low');
  assert.equal(result.context, 'work');
});

test('detects context', () => {
  assert.equal(keywordFallback('office mein bahut kaam hai, stress').context, 'work');
  assert.equal(keywordFallback('exam ka tension').context, 'studies');
  assert.equal(keywordFallback('broke up with my boyfriend').context, 'relationship');
});

test('normalize strips punctuation, apostrophes and accents', () => {
  assert.equal(normalize("Don't STOP, café!"), 'dont stop | cafe |');
});

test('explainKeywords reports matches and negation', () => {
  const explained = explainKeywords('not happy');
  assert.equal(explained.matches[0].text, 'happy');
  assert.equal(explained.matches[0].negated, true);
  assert.equal(explained.analysis.targetMoods[0], 'Sad');
});

test('runs in well under 50 ms per call', () => {
  const text = 'aaj office mein bahut kaam tha, boss ne gussa kiya, ab bas ghar jaake chill karna hai 😩';
  const runs = 200;
  const start = process.hrtime.bigint();
  for (let i = 0; i < runs; i += 1) keywordFallback(text);
  const perCallMs = Number(process.hrtime.bigint() - start) / 1e6 / runs;
  assert.ok(perCallMs < 50, `took ${perCallMs.toFixed(2)} ms per call`);
});
