-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    preferred_languages TEXT[] DEFAULT ARRAY['Hindi', 'English']::TEXT[],
    genres TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Songs Table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('Hindi', 'English')),
    genre TEXT NOT NULL,
    moods TEXT[] NOT NULL,
    energy TEXT NOT NULL CHECK (energy IN ('low', 'medium', 'high')),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mood Entries Table
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    emotion TEXT,
    energy TEXT,
    intensity TEXT,
    confirmed_mood TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Song Feedback Table
CREATE TABLE IF NOT EXISTS public.song_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'dislike', 'skip')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_song_feedback UNIQUE (user_id, song_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_language ON public.songs(language);
CREATE INDEX IF NOT EXISTS idx_songs_moods ON public.songs USING GIN(moods);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON public.mood_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_song_feedback_user_id ON public.song_feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Songs: Authenticated users can read all songs
CREATE POLICY "Anyone can view songs"
    ON public.songs FOR SELECT
    TO authenticated
    USING (true);

-- Mood Entries: Users can manage their own mood entries
CREATE POLICY "Users can view their own mood entries"
    ON public.mood_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries"
    ON public.mood_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
    ON public.mood_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Song Feedback: Users can manage their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.song_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert or update their own feedback"
    ON public.song_feedback FOR ALL
    USING (auth.uid() = user_id);

