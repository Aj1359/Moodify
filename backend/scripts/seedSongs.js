#!/usr/bin/env node
/**
 * Song Catalog Seeder (Niraj Chandekar - Phase 2).
 *
 * Reads 120 songs from backend/src/data/songs.seed.json, maps them
 * to the database schema via seedSongToRow(), and upserts them into
 * the Supabase `songs` table with their fixed UUIDs.
 *
 * Usage:
 *   node scripts/seedSongs.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { supabase } = require('../src/config/supabase');
const { seedSongToRow } = require('../src/utils/mappers');
const songs = require('../src/data/songs.seed.json');

const BATCH_SIZE = 40;

async function seedSongs() {
  console.log(`🎵 Starting song catalog seeding: ${songs.length} songs...`);

  if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
    console.error('❌ Error: Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.');
    console.error('Please configure your .env file before running the seed script.');
    process.exit(1);
  }

  const rows = songs.map(seedSongToRow);
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('songs')
      .upsert(batch, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }

    totalInserted += (data ? data.length : batch.length);
    console.log(`   ✓ Upserted songs ${i + 1} to ${Math.min(i + BATCH_SIZE, rows.length)}`);
  }

  console.log(`✅ Successfully seeded ${totalInserted} songs into the Supabase database!`);
}

if (require.main === module) {
  seedSongs().catch((err) => {
    console.error('❌ Unexpected seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seedSongs };
