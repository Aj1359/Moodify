const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreSong } = require('../src/utils/scoring');

const baseSong = {
  id: 'c2771016-ab21-54ff-885d-63f8038fa64d',
  title: 'Ilahi',
  artist: 'Arijit Singh',
  language: 'Hindi',
  genre: 'Bollywood',
  moods: ['Happy', 'Motivated'],
  energy: 'high',
  url: 'https://www.youtube.com/watch?v=fdubeMFwuGs',
};

test('scoring: first mood tag gets 1.0 mood match', () => {
  // First tag: 'Happy' -> 0.5 * 1.0 = 0.5. No lang match (user wants English), no feedback.
  const result = scoreSong(baseSong, { mood: 'Happy', languages: ['English'] });
  assert.equal(result.score, 0.5);
  assert.ok(result.reason.length <= 60);
});

test('scoring: later mood tag gets 0.7 mood match', () => {
  // Later tag: 'Motivated' -> 0.5 * 0.7 = 0.35. No lang match, no feedback.
  const result = scoreSong(baseSong, { mood: 'Motivated', languages: ['English'] });
  assert.equal(result.score, 0.35);
  assert.ok(result.reason.length <= 60);
});

test('scoring: language match adds 0.3', () => {
  // First tag 'Happy' (0.5) + Language 'Hindi' in preferred (0.3) = 0.8
  const result = scoreSong(baseSong, { mood: 'Happy', languages: ['Hindi'] });
  assert.equal(result.score, 0.8);
  assert.ok(result.reason.includes('Hindi'));
  assert.ok(result.reason.length <= 60);
});

test('scoring: liked artist adds 0.2 feedback boost and formats reason', () => {
  // 0.5 (mood) + 0.3 (lang) + 0.2 (artist boost) = 1.0
  const result = scoreSong(baseSong, {
    mood: 'Happy',
    languages: ['Hindi'],
    likedArtists: new Set(['Arijit Singh']),
  });
  assert.equal(result.score, 1.0);
  assert.equal(result.reason, 'Fits your Happy mood · you like Arijit Singh');
  assert.ok(result.reason.length <= 60);
});

test('scoring: liked genre adds 0.1 feedback boost if artist does not match', () => {
  // 0.5 (mood) + 0.3 (lang) + 0.2 * 0.5 (genre boost = 0.1) = 0.9
  const result = scoreSong(baseSong, {
    mood: 'Happy',
    languages: ['Hindi'],
    likedArtists: new Set(['Coldplay']),
    likedGenres: new Set(['Bollywood']),
  });
  assert.equal(result.score, 0.9);
  assert.equal(result.reason, 'Matches your Happy mood · you like Bollywood');
  assert.ok(result.reason.length <= 60);
});

test('scoring: handles comma-separated artists for feedback boost', () => {
  const collabSong = {
    ...baseSong,
    artist: 'Tochi Raina, Rekha Bhardwaj',
  };
  const result = scoreSong(collabSong, {
    mood: 'Happy',
    languages: ['Hindi'],
    likedArtists: new Set(['Rekha Bhardwaj']),
  });
  assert.equal(result.score, 1.0);
  assert.equal(result.reason, 'Fits your Happy mood · you like Rekha Bhardwaj');
  assert.ok(result.reason.length <= 60);
});

test('scoring: reason string is strictly <= 60 characters even with long names', () => {
  const longArtistSong = {
    ...baseSong,
    artist: 'Very Extremely Long Artist Name That Could Overflow The Sixty Character Limit',
  };
  const result = scoreSong(longArtistSong, {
    mood: 'Relaxed',
    likedArtists: new Set(['Very Extremely Long Artist Name That Could Overflow The Sixty Character Limit']),
  });
  assert.ok(result.reason.length <= 60);
});

