/**
 * Feedback Controller (Niraj Chandekar).
 * Handles:
 * - POST /api/feedback: like, dislike, or skip a song (upsert on user_id, song_id)
 * - GET /api/feedback/liked: list songs liked by the user, newest first
 */
const { supabase } = require('../config/supabase');
const { feedbackToRow, rowToFeedback, rowToSong } = require('../utils/mappers');

/**
 * POST /api/feedback
 * Upserts a like/dislike/skip action for the song.
 */
async function postFeedback(req, res, next) {
  try {
    const userId = req.user.id;
    const row = feedbackToRow(userId, req.valid.body);

    const { data, error } = await supabase
      .from('song_feedback')
      .upsert(row, { onConflict: 'user_id,song_id' })
      .select()
      .single();

    if (error) {
      console.error('Error recording song feedback:', error.message);
      return next(error);
    }

    const response = rowToFeedback(data);
    return res.status(200).json({ data: response });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/feedback/liked
 * Returns all songs the user has liked, ordered with the newest like first.
 */
async function getLikedSongs(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch user's liked song ids ordered by created_at DESC
    const { data: feedbackRows, error: feedbackErr } = await supabase
      .from('song_feedback')
      .select('song_id, created_at')
      .eq('user_id', userId)
      .eq('type', 'like')
      .order('created_at', { ascending: false });

    if (feedbackErr) {
      console.error('Error fetching liked songs list:', feedbackErr.message);
      return next(feedbackErr);
    }

    if (!feedbackRows || feedbackRows.length === 0) {
      return res.status(200).json({ data: { songs: [] } });
    }

    const songIds = feedbackRows.map((f) => f.song_id);

    // Fetch full song records
    const { data: songRows, error: songsErr } = await supabase
      .from('songs')
      .select('*')
      .in('id', songIds);

    if (songsErr) {
      console.error('Error fetching song details for liked songs:', songsErr.message);
      return next(songsErr);
    }

    // Preserve the newest-like-first order
    const songMap = new Map((songRows || []).map((s) => [s.id, rowToSong(s)]));
    const songs = songIds.map((id) => songMap.get(id)).filter(Boolean);

    return res.status(200).json({ data: { songs } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postFeedback,
  getLikedSongs,
};
