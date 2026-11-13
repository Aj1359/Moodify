#!/usr/bin/env node
/**
 * One-time migration: give every song in songs.seed.json a stable UUID.
 *
 * Ids are UUID v5 values derived from the song's original short id
 * (e.g. "h-01"), so running the script again always produces the same ids.
 * Songs that already have a UUID are left untouched, and only the id values
 * are rewritten so the rest of the file keeps its formatting.
 *
 * Usage: node scripts/assignSongIds.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SEED_PATH = path.join(__dirname, '..', 'src', 'data', 'songs.seed.json');

// Fixed namespace for Moodify song ids. Never change it, or every id changes.
const SONG_NAMESPACE = '3f6c1b0e-6d1a-4c55-9a39-5d0f7f4b8e21';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidV5(name, namespace) {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = crypto.createHash('sha1').update(ns).update(name, 'utf8').digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function main() {
  const original = fs.readFileSync(SEED_PATH, 'utf8');
  const seen = new Set();
  let changed = 0;

  const updated = original.replace(/"id":\s*"([^"]+)"/g, (match, id) => {
    if (UUID_RE.test(id)) {
      seen.add(id.toLowerCase());
      return match;
    }
    const uuid = uuidV5(`moodify:song:${id}`, SONG_NAMESPACE);
    if (seen.has(uuid)) throw new Error(`Duplicate id generated for ${id}`);
    seen.add(uuid);
    changed += 1;
    return `"id": "${uuid}"`;
  });

  // Fail loudly rather than write a broken catalog.
  const songs = JSON.parse(updated);
  if (songs.length !== seen.size) {
    throw new Error(`Expected ${songs.length} unique ids, found ${seen.size}`);
  }

  if (changed > 0) fs.writeFileSync(SEED_PATH, updated);
  console.log(`Assigned ${changed} new ids; ${songs.length} songs total.`);
}

if (require.main === module) main();

module.exports = { uuidV5, SONG_NAMESPACE };
