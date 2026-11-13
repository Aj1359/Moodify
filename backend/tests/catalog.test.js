const test = require('node:test');
const assert = require('node:assert/strict');

const songs = require('../src/data/songs.seed.json');
const fallback = require('../src/data/fallback_songs.json');
const { MOODS, LEVELS, SONG_LANGUAGES } = require('../src/config/constants');
const { UUID_RE } = require('../src/middlewares/validate');

const byId = new Map(songs.map((s) => [s.id, s]));

test('seed catalog: 120 songs, 60 per language, unique UUIDs', () => {
  assert.equal(songs.length, 120);
  assert.equal(byId.size, 120);
  for (const lang of SONG_LANGUAGES) assert.equal(songs.filter((s) => s.language === lang).length, 60);
  for (const s of songs) assert.match(s.id, UUID_RE, `${s.title} has a bad id`);
});

test('seed catalog: every song uses allowed values', () => {
  for (const s of songs) {
    assert.ok(SONG_LANGUAGES.includes(s.language), `${s.title}: language`);
    assert.ok(LEVELS.includes(s.energy), `${s.title}: energy`);
    assert.ok(s.moods.length >= 1, `${s.title}: no moods`);
    for (const mood of s.moods) assert.ok(MOODS.includes(mood), `${s.title}: mood ${mood}`);
    for (const field of ['title', 'artist', 'genre', 'url']) assert.ok(s[field], `${s.title}: ${field}`);
  }
});

test('fallback pool: 20 seed songs whose titles match the seed', () => {
  assert.equal(fallback.length, 20);
  assert.equal(new Set(fallback.map((f) => f.id)).size, 20);
  for (const f of fallback) {
    const song = byId.get(f.id);
    assert.ok(song, `fallback id ${f.id} is not in the seed catalog`);
    assert.equal(song.title, f.title, `fallback entry ${f.id} drifted from the seed`);
  }
});

test('fallback pool: balanced across languages and covers every mood at least twice', () => {
  const pool = fallback.map((f) => byId.get(f.id));
  for (const lang of SONG_LANGUAGES) assert.equal(pool.filter((s) => s.language === lang).length, 10);
  for (const mood of MOODS) {
    const count = pool.filter((s) => s.moods.includes(mood)).length;
    assert.ok(count >= 2, `${mood} has only ${count} fallback songs`);
  }
});
