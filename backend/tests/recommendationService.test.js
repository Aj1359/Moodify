const test = require('node:test');
const assert = require('node:assert/strict');
const { getRecommendations, getFallbackRecommendations } = require('../src/services/recommendationService');
const { MOODS } = require('../src/config/constants');

test('fallback recommendations: returns songs from fallback pool with score and reason', () => {
  const result = getFallbackRecommendations({ mood: 'Relaxed', limit: 5 });
  assert.equal(result.source, 'fallback');
  assert.ok(result.songs.length <= 5);
  assert.ok(result.songs.length > 0);

  for (const song of result.songs) {
    assert.ok(song.id);
    assert.ok(song.title);
    assert.ok(song.artist);
    assert.ok(song.moods.includes('Relaxed'));
    assert.equal(typeof song.score, 'number');
    assert.equal(typeof song.reason, 'string');
    assert.ok(song.reason.length <= 60);
  }
});

test('fallback recommendations: respects language filter', () => {
  const hindiResult = getFallbackRecommendations({ mood: 'Happy', languages: ['Hindi'], limit: 10 });
  assert.equal(hindiResult.source, 'fallback');
  for (const song of hindiResult.songs) {
    assert.equal(song.language, 'Hindi');
  }

  const englishResult = getFallbackRecommendations({ mood: 'Happy', languages: ['English'], limit: 10 });
  assert.equal(englishResult.source, 'fallback');
  for (const song of englishResult.songs) {
    assert.equal(song.language, 'English');
  }
});

test('getRecommendations: falls back gracefully without rejecting on unconfigured Supabase', async () => {
  const result = await getRecommendations({
    userId: '11111111-1111-1111-1111-111111111111',
    mood: 'Motivated',
    language: 'Both',
    limit: 10,
  });

  assert.ok(result);
  assert.ok(result.source === 'db' || result.source === 'fallback');
  assert.ok(Array.isArray(result.songs));
  assert.ok(result.songs.length <= 10);
});

test('getRecommendations: handles all 8 supported moods', async () => {
  for (const mood of MOODS) {
    const result = await getRecommendations({
      userId: 'test-user',
      mood,
      limit: 5,
    });
    assert.ok(result.songs.length > 0, `No songs for ${mood}`);
    for (const song of result.songs) {
      assert.ok(song.moods.includes(mood));
    }
  }
});


test('resolveLanguages: explicit filter wins, otherwise the profile languages', () => {
  const { resolveLanguages } = require('../src/services/recommendationService');
  assert.deepEqual(resolveLanguages('Hindi', ['English']), ['Hindi']);
  assert.deepEqual(resolveLanguages('English'), ['English']);
  assert.deepEqual(resolveLanguages('Both', ['Hindi']), ['Hindi', 'English']);
  assert.deepEqual(resolveLanguages(undefined, ['English']), ['English']);
  assert.deepEqual(resolveLanguages(undefined), ['Hindi', 'English']);
});
