/**
 * Mood Controller (Aditya Jha).
 * Handles mood analysis, confirmation, history retrieval, and entry deletion.
 */
const { supabase } = require('../config/supabase');
const { analyzeMood } = require('../services/emotionService');
const { confirmToMoodEntryRow, rowToMoodEntry } = require('../utils/mappers');
const { MOODS, ERROR_CODES } = require('../config/constants');

/**
 * POST /api/mood/analyze
 * Accepts free-text mood input and returns structured emotion JSON.
 */
async function analyze(req, res, next) {
  try {
    const { text } = req.valid.body;
    const analysis = await analyzeMood(text);
    return res.status(200).json({ data: analysis });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/mood/confirm
 * Saves confirmed mood entry and returns the saved entry.
 */
async function confirm(req, res, next) {
  try {
    const row = confirmToMoodEntryRow(req.user.id, req.valid.body);

    const { data, error } = await supabase
      .from('mood_entries')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Error inserting mood entry into Supabase:', error.message);
      return next(error);
    }

    const entry = rowToMoodEntry(data);
    return res.status(200).json({ data: { entry } });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/mood/history?limit=20
 * Returns user's recent mood logs and weekly mood distribution counts for the past 7 days.
 */
async function history(req, res, next) {
  try {
    const limit = req.valid.query.limit;
    const userId = req.user.id;

    // Fetch user mood entries, newest first
    const { data: entriesData, error: entriesError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entriesError) {
      console.error('Error fetching mood history:', entriesError.message);
      return next(entriesError);
    }

    // Calculate weekly counts over the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: weeklyData, error: weeklyError } = await supabase
      .from('mood_entries')
      .select('confirmed_mood')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo);

    if (weeklyError) {
      console.error('Error fetching weekly mood counts:', weeklyError.message);
      return next(weeklyError);
    }

    // Initialize all 8 moods to 0
    const weeklyCounts = {};
    for (const mood of MOODS) {
      weeklyCounts[mood] = 0;
    }

    if (Array.isArray(weeklyData)) {
      for (const item of weeklyData) {
        if (item.confirmed_mood && weeklyCounts[item.confirmed_mood] !== undefined) {
          weeklyCounts[item.confirmed_mood] += 1;
        }
      }
    }

    const entries = (entriesData || []).map(rowToMoodEntry);

    return res.status(200).json({
      data: {
        entries,
        weeklyCounts,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/mood/:id
 * Deletes a single entry by UUID, or all entries for the user if :id is 'all'.
 */
async function deleteMood(req, res, next) {
  try {
    const { id } = req.valid.params;
    const userId = req.user.id;

    if (id === 'all') {
      const { data, error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('Error deleting all mood entries:', error.message);
        return next(error);
      }

      return res.status(200).json({
        data: {
          deleted: data ? data.length : 0,
        },
      });
    }

    // Delete single entry
    const { data, error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('Error deleting mood entry:', error.message);
      return next(error);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Mood entry not found',
        },
      });
    }

    return res.status(200).json({
      data: {
        deleted: 1,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  analyze,
  confirm,
  history,
  deleteMood,
};

