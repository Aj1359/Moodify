/**
 * Recommendation Service (Niraj Chandekar).
 *
 * Implements GET /recommendations business logic:
 * - Fetches candidate songs from Supabase matching the target mood and language.
 * - Computes composite scores with scoreSong().
 * - Removes disliked songs after scoring.
 * - Falls back to the 20-song fallback pool on database error or unavailability.
 * - Never throws or rejects.
 */
const { supabase } = require('../config/supabase');
const { rowToSong } = require('../utils/mappers');
const { scoreSong } = require('../utils/scoring');
const songsCatalog = require('../data/songs.seed.json');
const fallbackPool = require('../data/fallback_songs.json');

// Fast in-memory index of seed songs by id
const catalogById = new Map(songsCatalog.map((s) => [s.id, s]));

/**
 * Build fallback recommendations from the offline pool.
 * @param {object} params
 * @param {string} params.mood
 * @param {string[]} [params.languages]
 * @param {number} [params.limit]
 * @returns {{ songs: object[], source: 'fallback' }}
 */
function getFallbackRecommendations({ mood, languages = ['Hindi', 'English'], limit = 10 }) {
  try {
    // Read full details of fallback songs from seed catalog
    const fallbackSongs = fallbackPool
      .map((item) => catalogById.get(item.id))
      .filter(Boolean);

    // Filter candidate songs tagged with the target mood
    let candidates = fallbackSongs.filter((s) => Array.isArray(s.moods) && s.moods.includes(mood));

    // If language filter matches candidates, prioritize matching language
    if (languages && languages.length > 0) {
      const langMatches = candidates.filter((s) => languages.includes(s.language));
      if (langMatches.length > 0) {
        candidates = langMatches;
      }
    }

    // Score candidates
    const scored = candidates.map((song) => {
      const { score, reason } = scoreSong(song, { mood, languages });
      return {
        ...song,
        score,
        reason,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return {
      songs: scored.slice(0, limit),
      source: 'fallback',
    };
  } catch (err) {
    console.warn('⚠️ Error generating fallback recommendations:', err.message);
    return {
      songs: [],
      source: 'fallback',
    };
  }
}

/**
 * Get personalized recommendations for a user.
 * @param {object} options
 * @param {string} options.userId - UUID of authenticated user
 * @param {string} options.mood - Required mood (e.g. 'Relaxed', 'Happy')
 * @param {string} [options.language] - Optional language filter ('Hindi', 'English', 'Both')
 * @param {number} [options.limit=10] - Number of recommendations to return (1-20)
 * @returns {Promise<{ songs: object[], source: 'db' | 'fallback' }>}
 */
async function getRecommendations({ userId, mood, language, limit = 10 }) {
  try {
    // 1. Fetch user profile to get preferred languages and genres
    let profileLanguages = ['Hindi', 'English'];
    let profileGenres = [];

    if (userId) {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('preferred_languages, genres')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileErr && profileData) {
        if (Array.isArray(profileData.preferred_languages) && profileData.preferred_languages.length > 0) {
          profileLanguages = profileData.preferred_languages;
        }
        if (Array.isArray(profileData.genres)) {
          profileGenres = profileData.genres;
        }
      }
    }

    // 2. Determine allowed languages for filtering
    let allowedLanguages;
    if (language === 'Hindi') {
      allowedLanguages = ['Hindi'];
    } else if (language === 'English') {
      allowedLanguages = ['English'];
    } else if (language === 'Both') {
      allowedLanguages = ['Hindi', 'English'];
    } else {
      // Default to profile's languages
      allowedLanguages = profileLanguages;
    }

    // 3. Fetch user feedback (likes, dislikes) to apply boost and exclude dislikes
    const dislikedSongIds = new Set();
    const likedSongIds = [];

    if (userId) {
      const { data: feedbackData, error: feedbackErr } = await supabase
        .from('song_feedback')
        .select('song_id, type')
        .eq('user_id', userId);

      if (!feedbackErr && Array.isArray(feedbackData)) {
        for (const item of feedbackData) {
          if (item.type === 'dislike') {
            dislikedSongIds.add(item.song_id);
          } else if (item.type === 'like') {
            likedSongIds.push(item.song_id);
          }
        }
      }
    }

    // 4. Retrieve artists and genres from liked songs
    const likedArtists = new Set();
    const likedGenres = new Set(profileGenres);

    if (likedSongIds.length > 0) {
      const { data: likedSongs, error: likedSongsErr } = await supabase
        .from('songs')
        .select('artist, genre')
        .in('id', likedSongIds);

      if (!likedSongsErr && Array.isArray(likedSongs)) {
        for (const s of likedSongs) {
          if (s.artist) {
            likedArtists.add(s.artist);
            s.artist.split(',').forEach((a) => likedArtists.add(a.trim()));
          }
          if (s.genre) {
            likedGenres.add(s.genre);
          }
        }
      }
    }

    // 5. Query candidate songs tagged with the target mood from the database
    let query = supabase
      .from('songs')
      .select('*')
      .contains('moods', [mood]);

    if (allowedLanguages.length === 1) {
      query = query.eq('language', allowedLanguages[0]);
    } else if (allowedLanguages.length > 1) {
      query = query.in('language', allowedLanguages);
    }

    const { data: candidateRows, error: songsErr } = await query;

    if (songsErr || !candidateRows || candidateRows.length === 0) {
      if (songsErr) {
        console.warn('⚠️ Supabase songs query error, falling back:', songsErr.message);
      }
      return getFallbackRecommendations({ mood, languages: allowedLanguages, limit });
    }

    // 6. Score candidate songs
    const scoredSongs = candidateRows.map((row) => {
      const { score, reason } = scoreSong(row, {
        mood,
        languages: profileLanguages,
        likedArtists,
        likedGenres,
      });
      return rowToSong(row, { score, reason });
    });

    // 7. Remove disliked songs after scoring (strictly enforced rule)
    const filteredSongs = scoredSongs.filter((song) => !dislikedSongIds.has(song.id));

    // 8. Sort songs descending by score
    filteredSongs.sort((a, b) => b.score - a.score);

    return {
      songs: filteredSongs.slice(0, limit),
      source: 'db',
    };
  } catch (err) {
    console.warn('⚠️ Exception in getRecommendations, serving fallback:', err.message);
    return getFallbackRecommendations({
      mood,
      languages: language === 'Hindi' ? ['Hindi'] : language === 'English' ? ['English'] : ['Hindi', 'English'],
      limit,
    });
  }
}

module.exports = {
  getRecommendations,
  getFallbackRecommendations,
};

