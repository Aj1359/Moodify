/**
 * Recommendation scoring engine (Niraj Chandekar).
 *
 * Implements the scoring formula specified in docs/api.md and README:
 *   Score(s) = 0.5 * MoodMatch + 0.3 * LanguageMatch + 0.2 * FeedbackBoost
 *
 * Rules:
 * - MoodMatch: 1.0 if mood is the song's first tag, 0.7 if a later tag, 0 if not tagged.
 * - LanguageMatch: 1.0 if song language is in preferred languages, else 0.
 * - FeedbackBoost: 1.0 if user liked a song by the same artist, 0.5 if liked same genre, else 0.
 * - Reason string: strictly <= 60 characters and states facts.
 */

/**
 * Score a single candidate song against user context.
 * @param {object} song - Song object { id, title, artist, language, genre, moods, energy, url }
 * @param {object} options
 * @param {string} options.mood - The target mood
 * @param {string[]} [options.languages] - User's preferred languages
 * @param {Set<string>|string[]} [options.likedArtists] - Artists user has liked
 * @param {Set<string>|string[]} [options.likedGenres] - Genres user has liked
 * @returns {{ score: number, reason: string }}
 */
function scoreSong(song, { mood, languages = [], likedArtists = new Set(), likedGenres = new Set() } = {}) {
  if (!song || !song.moods) {
    return { score: 0, reason: '' };
  }

  // Normalize liked collections to Sets for O(1) lookup
  const artistSet = likedArtists instanceof Set ? likedArtists : new Set(likedArtists);
  const genreSet = likedGenres instanceof Set ? likedGenres : new Set(likedGenres);

  // 1. Mood Match (weight: 0.5)
  // Only songs tagged with the mood are candidates: 1.0 for first tag, 0.7 for later tag
  let moodMatch = 0;
  if (Array.isArray(song.moods) && song.moods.length > 0) {
    if (song.moods[0] === mood) {
      moodMatch = 1.0;
    } else if (song.moods.includes(mood)) {
      moodMatch = 0.7;
    }
  }

  // 2. Language Match (weight: 0.3)
  // 1.0 if song's language is in user's preferred languages, else 0
  const languageMatch = Array.isArray(languages) && languages.includes(song.language) ? 1.0 : 0.0;

  // 3. Feedback Boost (weight: 0.2)
  // 1.0 when user liked another song by the same artist, 0.5 for same genre, else 0
  let feedbackBoost = 0;
  let matchedArtist = null;
  let matchedGenre = false;

  if (song.artist) {
    // Check full artist string or split individual artists (e.g. "Tochi Raina, Rekha Bhardwaj")
    if (artistSet.has(song.artist)) {
      feedbackBoost = 1.0;
      matchedArtist = song.artist;
    } else {
      const individualArtists = song.artist.split(',').map((a) => a.trim());
      for (const artist of individualArtists) {
        if (artistSet.has(artist)) {
          feedbackBoost = 1.0;
          matchedArtist = artist;
          break;
        }
      }
    }
  }

  if (feedbackBoost === 0 && song.genre && genreSet.has(song.genre)) {
    feedbackBoost = 0.5;
    matchedGenre = true;
  }

  // Calculate composite weighted score
  const totalScore = 0.5 * moodMatch + 0.3 * languageMatch + 0.2 * feedbackBoost;
  const score = Math.round(totalScore * 100) / 100;

  // Generate fact-based reason string (strictly <= 60 characters)
  let reason = '';
  if (matchedArtist) {
    reason = `Fits your ${mood} mood · you like ${matchedArtist}`;
  } else if (matchedGenre) {
    reason = `Matches your ${mood} mood · you like ${song.genre}`;
  } else if (languageMatch === 1.0 && moodMatch === 1.0) {
    reason = `Top ${song.language} pick for your ${mood} mood`;
  } else if (languageMatch === 1.0) {
    reason = `Matches your ${mood} mood in ${song.language}`;
  } else {
    reason = `Fits your ${mood} mood`;
  }

  // Ensure reason never exceeds 60 characters
  if (reason.length > 60) {
    reason = reason.slice(0, 57) + '...';
  }

  return { score, reason };
}

module.exports = {
  scoreSong,
};

