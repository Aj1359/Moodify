/**
 * Interactive Recommendation Demo Script (Niraj Chandekar).
 * Run this anytime to see live song recommendations for different moods!
 *
 * Usage:
 *   node backend/scripts/demoRecommendations.js
 *   node backend/scripts/demoRecommendations.js Relaxed Hindi
 *   node backend/scripts/demoRecommendations.js Motivated English
 */
const { getRecommendations } = require('../src/services/recommendationService');

const mood = process.argv[2] || 'Relaxed';
const language = process.argv[3] || 'Both';
const limit = 5;

async function runDemo() {
  console.log(`\n======================================================`);
  console.log(`🎵 MOODIFY RECOMMENDATION ENGINE TEST`);
  console.log(`======================================================`);
  console.log(`🎯 Testing Mood:     ${mood}`);
  console.log(`🌐 Language Filter:  ${language}`);
  console.log(`📊 Song Limit:       ${limit}`);
  console.log(`------------------------------------------------------\n`);

  const startTime = Date.now();
  const result = await getRecommendations({
    userId: 'demo-user-123',
    mood,
    language,
    limit,
  });
  const elapsed = Date.now() - startTime;

  console.log(`✅ Recommendations generated in ${elapsed} ms (Source: [${result.source.toUpperCase()}])\n`);

  if (!result.songs || result.songs.length === 0) {
    console.log(`⚠️ No songs found for mood "${mood}".`);
    return;
  }

  result.songs.forEach((song, index) => {
    console.log(`${index + 1}. 🎶 "${song.title}" - ${song.artist}`);
    console.log(`   • Language: ${song.language} | Genre: ${song.genre} | Energy: ${song.energy}`);
    console.log(`   • Moods:    [${song.moods.join(', ')}]`);
    console.log(`   • Score:    ⭐ ${song.score}`);
    console.log(`   • Reason:   💡 "${song.reason}"`);
    console.log(`   • Link:     ▶️  ${song.url}`);
    console.log(``);
  });

  console.log(`======================================================`);
  console.log(`Tip: Try running with other moods:`);
  console.log(`  node backend/scripts/demoRecommendations.js Happy Hindi`);
  console.log(`  node backend/scripts/demoRecommendations.js Motivated English`);
  console.log(`  node backend/scripts/demoRecommendations.js Sad Both`);
  console.log(`======================================================\n`);
}

runDemo().catch(console.error);

