/**
 * Checks every song link in songs.seed.json against YouTube's public oEmbed
 * endpoint, which answers 404 for removed, private or non-existent videos.
 *
 *   npm run links          report dead links and links that open a different song
 *   npm run links -- --fix replace those with a YouTube search for "title artist"
 *
 * A search link cannot go dead when one upload is taken down, and it opens in the
 * YouTube app like a video link. After --fix, run `npm run seed` to update Supabase.
 */
const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'src', 'data', 'songs.seed.json');
const FIX = process.argv.includes('--fix');
const CONCURRENCY = 6;

const words = (s) =>
  s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean);

function searchUrl(song) {
  const mainArtist = song.artist.split(',')[0].trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${mainArtist}`).replace(/%20/g, '+')}`;
}

async function check(song) {
  if (!/youtube\.com\/watch\?v=/.test(song.url)) return { ok: true, kind: 'search' };
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(song.url)}`);
  // 401 means the video exists but its owner disabled embedding: it still plays on YouTube.
  if (res.status === 401) return { ok: true, kind: 'video' };
  if (!res.ok) return { ok: false, reason: `video unavailable (HTTP ${res.status})` };
  const { title } = await res.json();
  const videoTitle = words(title).join(' ');
  // Not a single word of the song title in the video title: the link opens another song.
  if (!words(song.title).some((w) => videoTitle.includes(w))) {
    return { ok: false, reason: `opens a different video: "${title}"` };
  }
  return { ok: true, kind: 'video' };
}

async function main() {
  const songs = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const queue = songs.map((song, i) => ({ song, i }));
  const problems = [];

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const { song, i } = queue.shift();
        try {
          const result = await check(song);
          if (!result.ok) problems.push({ i, song, reason: result.reason });
        } catch (err) {
          console.warn(`Could not check "${song.title}": ${err.message}`);
        }
      }
    })
  );

  problems.sort((a, b) => a.i - b.i);
  for (const { song, reason } of problems) console.log(`✗ ${song.title} (${song.artist}): ${reason}`);
  console.log(`\n${songs.length - problems.length} of ${songs.length} links OK, ${problems.length} need fixing.`);

  if (!FIX || problems.length === 0) {
    if (problems.length) console.log('Run with --fix to replace them with YouTube search links.');
    process.exitCode = problems.length ? 1 : 0;
    return;
  }

  for (const { song } of problems) song.url = searchUrl(song);
  fs.writeFileSync(SEED_FILE, `${JSON.stringify(songs, null, 2)}\n`, 'utf8');
  console.log(`Replaced ${problems.length} links in songs.seed.json. Run \`npm run seed\` to update Supabase.`);
}

main();
