const test = require('node:test');
const assert = require('node:assert/strict');

const m = require('../src/utils/mappers');

const USER = '00000000-0000-4000-8000-000000000001';

test('toCamel and toSnake convert keys deeply and leave values alone', () => {
  const row = { user_id: USER, preferred_languages: ['Hindi'], nested_obj: { created_at: 'x' }, list: [{ song_id: 1 }] };
  const camel = m.toCamel(row);
  assert.deepEqual(camel, { userId: USER, preferredLanguages: ['Hindi'], nestedObj: { createdAt: 'x' }, list: [{ songId: 1 }] });
  assert.deepEqual(m.toSnake(camel), row);
});

test('rowToProfile returns exactly the UserProfile fields', () => {
  const profile = m.rowToProfile({
    user_id: USER,
    name: 'Aditi',
    preferred_languages: ['Hindi', 'English'],
    genres: ['Lo-Fi'],
    created_at: '2026-11-12T10:00:00Z',
    updated_at: '2026-11-12T10:00:00Z',
  });
  assert.deepEqual(profile, { userId: USER, name: 'Aditi', preferredLanguages: ['Hindi', 'English'], genres: ['Lo-Fi'] });
  assert.equal(m.rowToProfile(null), null);
});

test('rowToMoodEntry maps every MoodEntry field and formats dates as ISO strings', () => {
  const entry = m.rowToMoodEntry({
    id: 'e1',
    user_id: USER,
    input_text: 'thak gaya',
    emotion: 'exhaustion',
    energy: 'low',
    intensity: 'high',
    confirmed_mood: 'Relaxed',
    created_at: new Date('2026-11-12T10:00:00Z'),
  });
  assert.deepEqual(entry, {
    id: 'e1',
    userId: USER,
    inputText: 'thak gaya',
    emotion: 'exhaustion',
    energy: 'low',
    intensity: 'high',
    confirmedMood: 'Relaxed',
    createdAt: '2026-11-12T10:00:00.000Z',
  });
});

test('rowToSong drops database-only fields and adds score and reason when given', () => {
  const row = {
    id: 's1', title: 'Kabira', artist: 'Tochi Raina', language: 'Hindi', genre: 'Sufi Pop',
    moods: ['Nostalgic'], energy: 'low', url: 'https://www.youtube.com/watch?v=abc', created_at: 'x',
  };
  assert.equal('createdAt' in m.rowToSong(row), false);
  assert.equal('score' in m.rowToSong(row), false);
  const ranked = m.rowToSong(row, { score: 0.8, reason: 'Fits your Nostalgic mood' });
  assert.equal(ranked.score, 0.8);
  assert.equal(ranked.reason, 'Fits your Nostalgic mood');
});

test('request bodies map to database rows', () => {
  const prefs = m.preferencesToRow(USER, { name: 'Aditi', preferredLanguages: ['Hindi'], genres: [] });
  assert.equal(prefs.user_id, USER);
  assert.deepEqual(prefs.preferred_languages, ['Hindi']);
  assert.ok(prefs.updated_at);

  const entry = m.confirmToMoodEntryRow(USER, {
    text: 'thak gaya',
    confirmedMood: 'Relaxed',
    analysis: { emotion: 'exhaustion', energy: 'low', intensity: 'high', context: 'work', targetMoods: ['Relaxed'], source: 'llm' },
  });
  assert.deepEqual(entry, {
    user_id: USER, input_text: 'thak gaya', emotion: 'exhaustion', energy: 'low', intensity: 'high', confirmed_mood: 'Relaxed',
  });

  assert.deepEqual(m.feedbackToRow(USER, { songId: 's1', type: 'like' }), { user_id: USER, song_id: 's1', type: 'like' });
  assert.deepEqual(m.rowToFeedback({ user_id: USER, song_id: 's1', type: 'like' }), { songId: 's1', type: 'like' });
});
