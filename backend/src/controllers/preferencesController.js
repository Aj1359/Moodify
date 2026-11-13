/**
 * Preferences / Profile Controller (Aditya Jha).
 * Handles reading and updating user preferences and onboarding state.
 */
const { supabase } = require('../config/supabase');
const { rowToProfile, preferencesToRow } = require('../utils/mappers');
const { ERROR_CODES } = require('../config/constants');

/**
 * GET /api/preferences
 * Returns the current user's profile, or 404 PROFILE_NOT_FOUND if onboarding is incomplete.
 */
async function getPreferences(req, res, next) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile from Supabase:', error.message);
      return next(error);
    }

    if (!data) {
      return res.status(404).json({
        error: {
          code: ERROR_CODES.PROFILE_NOT_FOUND,
          message: 'User has not completed onboarding',
        },
      });
    }

    const profile = rowToProfile(data);
    return res.status(200).json({ data: profile });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/preferences
 * Creates or updates the user profile with name, preferredLanguages, and genres.
 */
async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const row = preferencesToRow(userId, req.valid.body);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile in Supabase:', error.message);
      return next(error);
    }

    const profile = rowToProfile(data);
    return res.status(200).json({ data: profile });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
};

