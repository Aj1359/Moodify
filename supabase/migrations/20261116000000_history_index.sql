-- GET /api/mood/history filters by user and orders by newest first.
-- One composite index serves both, replacing two single-column lookups.
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created
    ON public.mood_entries (user_id, created_at DESC);

-- GET /api/feedback/liked filters by user and type and orders by newest first.
CREATE INDEX IF NOT EXISTS idx_song_feedback_user_type_created
    ON public.song_feedback (user_id, type, created_at DESC);
