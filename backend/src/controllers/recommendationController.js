/**
 * Recommendation Controller (Niraj Chandekar).
 * Handles GET /api/recommendations.
 */
const { getRecommendations } = require('../services/recommendationService');

/**
 * GET /api/recommendations?mood=Relaxed&language=Both&limit=10
 * Returns ranked songs for the target mood, language, and user taste.
 */
async function recommendations(req, res, next) {
  try {
    const { mood, language, limit } = req.valid.query;
    const userId = req.user.id;

    const result = await getRecommendations({
      userId,
      mood,
      language,
      limit,
    });

    return res.status(200).json({
      data: {
        songs: result.songs,
        source: result.source,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getRecommendations: recommendations,
};
