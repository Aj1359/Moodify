import { SupportedMood } from '../constants/moods';

export interface UserProfile {
  userId: string;
  name: string;
  preferredLanguages: ('Hindi' | 'English')[];
  genres: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: 'Hindi' | 'English';
  genre: string;
  moods: SupportedMood[];
  energy: 'low' | 'medium' | 'high';
  url: string;
  score?: number;
  reason?: string;
}

export type AnalysisSource = 'llm' | 'keyword';
export type RecommendationSource = 'db' | 'fallback';
export type LanguageFilter = 'Hindi' | 'English' | 'Both';

export interface MoodAnalysisResult {
  emotion: string;
  energy: 'low' | 'medium' | 'high';
  intensity: 'low' | 'medium' | 'high';
  context: string;
  /** 1-3 moods, strongest first. targetMoods[0] is shown as the detected mood. */
  targetMoods: SupportedMood[];
  /** 'keyword' when the LLM failed or timed out and the rule-based fallback answered. */
  source: AnalysisSource;
}

export interface MoodEntry {
  id: string;
  userId: string;
  inputText: string;
  emotion: string;
  energy: string;
  intensity: string;
  confirmedMood: SupportedMood;
  createdAt: string;
}

export type FeedbackType = 'like' | 'dislike' | 'skip';

/** Mood counts for the last 7 days. Every mood is present, 0 when none. */
export type WeeklyCounts = Record<SupportedMood, number>;

// ---------------------------------------------------------------------------
// API contract. Every response is { data } on success or { error } on failure.
// See README section 6 for the full endpoint table.
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
}

export type ApiResponse<T> = { data: T } | { error: ApiErrorBody };

/** POST /api/mood/analyze */
export interface AnalyzeMoodRequest {
  text: string;
}

/** POST /api/mood/confirm */
export interface ConfirmMoodRequest {
  text: string;
  confirmedMood: SupportedMood;
  /** The object /mood/analyze returned, sent back unchanged. */
  analysis: MoodAnalysisResult;
}
export interface ConfirmMoodResponse {
  entry: MoodEntry;
}

/** GET /api/mood/history */
export interface MoodHistoryResponse {
  entries: MoodEntry[];
  weeklyCounts: WeeklyCounts;
}

/** DELETE /api/mood/:id  (id = UUID or 'all') */
export interface DeleteMoodResponse {
  deleted: number;
}

/** PUT /api/preferences */
export interface UpdatePreferencesRequest {
  name: string;
  preferredLanguages: ('Hindi' | 'English')[];
  genres: string[];
}

/** GET /api/recommendations */
export interface RecommendationsQuery {
  mood: SupportedMood;
  language?: LanguageFilter;
  limit?: number;
}
export interface RecommendationsResponse {
  songs: Song[];
  source: RecommendationSource;
}

/** POST /api/feedback */
export interface FeedbackRequest {
  songId: string;
  type: FeedbackType;
}
export type FeedbackResponse = FeedbackRequest;

/** GET /api/feedback/liked */
export interface LikedSongsResponse {
  songs: Song[];
}

