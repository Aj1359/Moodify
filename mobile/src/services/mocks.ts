/**
 * Contract-accurate mock backend for building the app before the API is live.
 *
 * `mockFetch` is a drop-in replacement for `fetch`: same arguments, and it
 * answers every endpoint in README section 6.3 with the same status codes and
 * { data } / { error } envelopes as the real backend. The API client only has
 * to swap one function:
 *
 *   const doFetch = process.env.EXPO_PUBLIC_USE_MOCKS === 'true' ? mockFetch : fetch;
 *
 * State (mood entries, feedback, profile) lives in memory and resets when the
 * app reloads. Test hooks:
 *   - put "#error" in mood text     -> 500 INTERNAL_ERROR
 *   - put "#fallback" in mood text  -> analysis with source 'keyword'
 *   - setMockState({ onboarded: false }) -> GET /preferences returns PROFILE_NOT_FOUND
 */
import { SUPPORTED_MOODS, SupportedMood } from '../constants/moods';
import type {
  ApiErrorCode,
  ApiResponse,
  ConfirmMoodRequest,
  FeedbackRequest,
  FeedbackType,
  LanguageFilter,
  MoodAnalysisResult,
  MoodEntry,
  Song,
  UpdatePreferencesRequest,
  UserProfile,
  WeeklyCounts,
} from '../types';

export const MOCK_DELAY_MS = 450;

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const DAY_MS = 24 * 60 * 60 * 1000;
const MOOD_NAMES: SupportedMood[] = SUPPORTED_MOODS.map((m) => m.name);

/** The 20-song fallback pool, with YouTube search links standing in for real links. */
const SONGS: Song[] = [
  { id: 'c2771016-ab21-54ff-885d-63f8038fa64d', title: 'Ilahi', artist: 'Arijit Singh', language: 'Hindi', genre: 'Bollywood', moods: ['Happy', 'Motivated'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Ilahi+Arijit+Singh' },
  { id: 'bc9bff27-d436-5c3f-b3b6-a297931f67e1', title: 'Don\'t Stop Me Now', artist: 'Queen', language: 'English', genre: 'Classic Rock', moods: ['Happy', 'Motivated'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Don%27t+Stop+Me+Now+Queen' },
  { id: '06489a66-e285-5685-8b2d-ee4dc5d9e1db', title: 'Aadat', artist: 'Atif Aslam', language: 'Hindi', genre: 'Rock', moods: ['Sad', 'Nostalgic', 'Angry'], energy: 'medium', url: 'https://www.youtube.com/results?search_query=Aadat+Atif+Aslam' },
  { id: '9baf2784-0b63-5ac9-9d6b-96f3138b63e5', title: 'Fix You', artist: 'Coldplay', language: 'English', genre: 'Alternative Rock', moods: ['Sad', 'Relaxed', 'Nostalgic'], energy: 'low', url: 'https://www.youtube.com/results?search_query=Fix+You+Coldplay' },
  { id: '1452ef4d-995a-57fc-8042-d7150b548a25', title: 'Bekhayali', artist: 'Sachet Tandon', language: 'Hindi', genre: 'Rock / Heartbreak', moods: ['Angry', 'Sad', 'Stressed'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Bekhayali+Sachet+Tandon' },
  { id: '6a00a15e-2b41-577c-b8e7-e5aea986ec7a', title: 'In the End', artist: 'Linkin Park', language: 'English', genre: 'Nu Metal', moods: ['Angry', 'Stressed'], energy: 'high', url: 'https://www.youtube.com/results?search_query=In+the+End+Linkin+Park' },
  { id: '035aab9b-ecf8-59ff-8e26-9401c52d1c46', title: 'Nadaan Parindey', artist: 'A.R. Rahman, Mohit Chauhan', language: 'Hindi', genre: 'Rock', moods: ['Sad', 'Stressed', 'Angry'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Nadaan+Parindey+A.R.+Rahman' },
  { id: 'e4a833d8-0c55-5b3b-b889-2382bf2eafdf', title: 'Chandelier', artist: 'Sia', language: 'English', genre: 'Electropop', moods: ['Stressed', 'Sad'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Chandelier+Sia' },
  { id: 'fca3f7f1-3ba1-56d6-b348-d7b8f253a784', title: 'Iktara', artist: 'Kavita Seth, Amitabh Bhattacharya', language: 'Hindi', genre: 'Indie Pop', moods: ['Relaxed', 'Romantic', 'Nostalgic'], energy: 'low', url: 'https://www.youtube.com/results?search_query=Iktara+Kavita+Seth' },
  { id: '296d808f-f8ba-5fb1-a776-28f1f2d56975', title: 'Holocene', artist: 'Bon Iver', language: 'English', genre: 'Indie Folk', moods: ['Relaxed', 'Sad', 'Nostalgic'], energy: 'low', url: 'https://www.youtube.com/results?search_query=Holocene+Bon+Iver' },
  { id: 'cf1b0bca-9834-545e-bef8-1562ac11ae98', title: 'Zinda', artist: 'Siddharth Mahadevan', language: 'Hindi', genre: 'Rock', moods: ['Motivated', 'Angry'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Zinda+Siddharth+Mahadevan' },
  { id: '994a39ed-d4d4-57ac-b8a8-4cedf3775811', title: 'Lose Yourself', artist: 'Eminem', language: 'English', genre: 'Hip Hop', moods: ['Motivated', 'Angry'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Lose+Yourself+Eminem' },
  { id: 'b83ae5e8-aa56-5a8f-994b-aabe41096956', title: 'Apna Bana Le', artist: 'Arijit Singh', language: 'Hindi', genre: 'Romantic', moods: ['Romantic', 'Relaxed'], energy: 'medium', url: 'https://www.youtube.com/results?search_query=Apna+Bana+Le+Arijit+Singh' },
  { id: 'f219128a-6f0e-5a22-82c8-4f1e109d82a7', title: 'Yellow', artist: 'Coldplay', language: 'English', genre: 'Alternative', moods: ['Romantic', 'Nostalgic', 'Relaxed'], energy: 'medium', url: 'https://www.youtube.com/results?search_query=Yellow+Coldplay' },
  { id: '8bd3758f-cbc9-5f9b-ae32-5c26cacc6343', title: 'Kabira', artist: 'Tochi Raina, Rekha Bhardwaj', language: 'Hindi', genre: 'Sufi Pop', moods: ['Nostalgic', 'Sad', 'Relaxed'], energy: 'low', url: 'https://www.youtube.com/results?search_query=Kabira+Tochi+Raina' },
  { id: 'c2ea5dd9-c159-5a86-8540-ee919aaecf83', title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', language: 'English', genre: 'Hard Rock', moods: ['Nostalgic', 'Happy', 'Motivated'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Sweet+Child+O%27+Mine+Guns+N%27+Roses' },
  { id: '71c8e6d6-d093-5fb5-b366-b71d78135ae9', title: 'Kar Gayi Chull', artist: 'Badshah, Neha Kakkar', language: 'Hindi', genre: 'Party Dance', moods: ['Happy', 'Motivated'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Kar+Gayi+Chull+Badshah' },
  { id: 'bac90aee-b629-559e-9322-9452406073e6', title: 'Tum Hi Ho', artist: 'Arijit Singh', language: 'Hindi', genre: 'Romantic', moods: ['Romantic', 'Sad'], energy: 'medium', url: 'https://www.youtube.com/results?search_query=Tum+Hi+Ho+Arijit+Singh' },
  { id: 'ab4bd775-75cb-5dcf-9608-1d54e8eba39d', title: 'Counting Stars', artist: 'OneRepublic', language: 'English', genre: 'Pop Rock', moods: ['Happy', 'Motivated'], energy: 'high', url: 'https://www.youtube.com/results?search_query=Counting+Stars+OneRepublic' },
  { id: '0232dd0e-d490-5f9b-88e1-05f304f0b6a7', title: 'Viva La Vida (Lo-Fi)', artist: 'Lofi Fruits', language: 'English', genre: 'Lo-Fi', moods: ['Relaxed', 'Stressed', 'Nostalgic'], energy: 'low', url: 'https://www.youtube.com/results?search_query=Viva+La+Vida+%28Lo-Fi%29+Lofi+Fruits' },
];

/** A few cue words per mood, so the Mood AI screen shows believable results. */
const MOCK_CUES: [RegExp, SupportedMood, string][] = [
  [/thak|tired|exhaust|relax|chill|sukoon|aaram|आराम|थक/i, 'Relaxed', 'exhaustion'],
  [/stress|tension|pareshan|anxious|exam|deadline|तनाव|परेशान/i, 'Stressed', 'stress'],
  [/sad|udaas|udas|dukhi|rona|cry|breakup|alone|akela|उदास|दुखी/i, 'Sad', 'sadness'],
  [/angry|gussa|irritat|frustrat|naraz|गुस्सा/i, 'Angry', 'anger'],
  [/gym|motivat|josh|focus|hustle|workout|जोश/i, 'Motivated', 'determination'],
  [/love|pyaar|pyar|crush|date|ishq|प्यार/i, 'Romantic', 'love'],
  [/miss|yaad|bachpan|childhood|old days|nostalg|याद|बचपन/i, 'Nostalgic', 'nostalgia'],
  [/happy|khush|excited|party|mast|maza|खुश/i, 'Happy', 'joy'],
];

const ENERGY: Record<SupportedMood, MoodAnalysisResult['energy']> = {
  Happy: 'high',
  Sad: 'low',
  Angry: 'high',
  Stressed: 'medium',
  Relaxed: 'low',
  Motivated: 'high',
  Romantic: 'medium',
  Nostalgic: 'medium',
};

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

interface MockState {
  onboarded: boolean;
  profile: UserProfile;
  entries: MoodEntry[];
  feedback: { songId: string; type: FeedbackType; at: number }[];
}

function initialState(): MockState {
  const now = Date.now();
  const entry = (daysAgo: number, mood: SupportedMood, text: string, emotion: string): MoodEntry => ({
    id: fakeUuid(),
    userId: MOCK_USER_ID,
    inputText: text,
    emotion,
    energy: ENERGY[mood],
    intensity: 'medium',
    confirmedMood: mood,
    createdAt: new Date(now - daysAgo * DAY_MS).toISOString(),
  });
  return {
    onboarded: true,
    profile: {
      userId: MOCK_USER_ID,
      name: 'Test User',
      preferredLanguages: ['Hindi', 'English'],
      genres: ['Bollywood', 'Lo-Fi'],
    },
    entries: [
      entry(0, 'Relaxed', 'aaj bahut thak gaya hu, kuch chill sunna hai', 'exhaustion'),
      entry(1, 'Stressed', 'exam kal hai aur kuch padha nahi', 'stress'),
      entry(2, 'Happy', 'finally got the internship!!', 'joy'),
      entry(3, 'Nostalgic', 'school ke dost yaad aa rahe hain', 'nostalgia'),
      entry(5, 'Stressed', 'too many deadlines this week', 'stress'),
      entry(9, 'Sad', 'feeling low today', 'sadness'),
    ],
    feedback: [],
  };
}

let state: MockState = initialState();

/** Change mock state from a dev screen or a test, e.g. { onboarded: false }. */
export function setMockState(patch: Partial<MockState>): void {
  state = { ...state, ...patch };
}

export function resetMockState(): void {
  state = initialState();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeUuid(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const part = (n: number) => Array.from({ length: n }, hex).join('');
  return `${part(8)}-${part(4)}-4${part(3)}-8${part(3)}-${part(12)}`;
}

function isMood(value: unknown): value is SupportedMood {
  return typeof value === 'string' && (MOOD_NAMES as string[]).includes(value);
}

function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    out[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return out;
}

interface Reply {
  status: number;
  body: ApiResponse<unknown>;
}

const ok = (data: unknown, status = 200): Reply => ({ status, body: { data } });
const err = (status: number, code: ApiErrorCode, message: string): Reply => ({
  status,
  body: { error: { code, message } },
});

function analyse(text: string): MoodAnalysisResult {
  const hits = MOCK_CUES.filter(([re]) => re.test(text));
  const targetMoods = hits.slice(0, 3).map(([, mood]) => mood);
  const top = targetMoods[0] ?? 'Relaxed';
  return {
    emotion: hits[0]?.[2] ?? 'neutral',
    energy: hits.length ? ENERGY[top] : 'medium',
    intensity: /bahut|bohot|very|so |!!/i.test(text) ? 'high' : hits.length ? 'medium' : 'low',
    context: /office|work|boss|kaam/i.test(text) ? 'work' : /exam|padhai|college/i.test(text) ? 'studies' : 'general',
    targetMoods: targetMoods.length ? targetMoods : ['Relaxed'],
    source: text.includes('#fallback') ? 'keyword' : 'llm',
  };
}

function weeklyCounts(): WeeklyCounts {
  const counts = Object.fromEntries(MOOD_NAMES.map((m) => [m, 0])) as WeeklyCounts;
  const since = Date.now() - 7 * DAY_MS;
  for (const entry of state.entries) {
    if (Date.parse(entry.createdAt) >= since) counts[entry.confirmedMood] += 1;
  }
  return counts;
}

function latestFeedback(): Map<string, FeedbackType> {
  const map = new Map<string, FeedbackType>();
  for (const f of state.feedback) map.set(f.songId, f.type);
  return map;
}

function recommend(mood: SupportedMood, language: LanguageFilter | undefined, limit: number): Song[] {
  const languages = language && language !== 'Both' ? [language] : state.profile.preferredLanguages;
  const feedback = latestFeedback();
  const liked = SONGS.filter((s) => feedback.get(s.id) === 'like');
  const likedArtists = new Set(liked.map((s) => s.artist));
  const likedGenres = new Set(liked.map((s) => s.genre));

  return SONGS.filter((s) => s.moods.includes(mood))
    .filter((s) => (language && language !== 'Both' ? s.language === language : true))
    .filter((s) => feedback.get(s.id) !== 'dislike')
    .map((s) => {
      const moodMatch = s.moods[0] === mood ? 1 : 0.7;
      const languageMatch = languages.includes(s.language) ? 1 : 0;
      const boost = likedArtists.has(s.artist) ? 1 : likedGenres.has(s.genre) ? 0.5 : 0;
      const score = Math.round((0.5 * moodMatch + 0.3 * languageMatch + 0.2 * boost) * 100) / 100;
      const reason = boost === 1 ? `Fits your ${mood} mood · you like ${s.artist}` : `Fits your ${mood} mood · ${s.language}`;
      return { ...s, score, reason };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function route(method: string, path: string, query: Record<string, string>, body: any): Reply {
  if (method === 'POST' && path === '/mood/analyze') {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (text.length < 1 || text.length > 500) return err(400, 'VALIDATION_ERROR', 'text must be 1-500 characters');
    if (text.includes('#error')) return err(500, 'INTERNAL_ERROR', 'Simulated server error');
    return ok(analyse(text));
  }

  if (method === 'POST' && path === '/mood/confirm') {
    const req = body as ConfirmMoodRequest;
    if (!req?.text || !isMood(req.confirmedMood) || !req.analysis) {
      return err(400, 'VALIDATION_ERROR', 'text, confirmedMood and analysis are required');
    }
    const entry: MoodEntry = {
      id: fakeUuid(),
      userId: MOCK_USER_ID,
      inputText: req.text.trim(),
      emotion: req.analysis.emotion,
      energy: req.analysis.energy,
      intensity: req.analysis.intensity,
      confirmedMood: req.confirmedMood,
      createdAt: new Date().toISOString(),
    };
    state.entries = [entry, ...state.entries];
    return ok({ entry });
  }

  if (method === 'GET' && path === '/mood/history') {
    const limit = query.limit ? Number(query.limit) : 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return err(400, 'VALIDATION_ERROR', 'limit must be a whole number from 1 to 100');
    }
    const entries = [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    return ok({ entries, weeklyCounts: weeklyCounts() });
  }

  const deleteMatch = path.match(/^\/mood\/([^/]+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const id = deleteMatch[1];
    const before = state.entries.length;
    state.entries = id === 'all' ? [] : state.entries.filter((e) => e.id !== id);
    const deleted = before - state.entries.length;
    if (id !== 'all' && deleted === 0) return err(404, 'NOT_FOUND', 'Mood entry not found');
    return ok({ deleted });
  }

  if (method === 'GET' && path === '/preferences') {
    if (!state.onboarded) return err(404, 'PROFILE_NOT_FOUND', 'Finish onboarding first');
    return ok(state.profile);
  }

  if (method === 'PUT' && path === '/preferences') {
    const req = body as UpdatePreferencesRequest;
    if (!req?.name || !Array.isArray(req.preferredLanguages) || req.preferredLanguages.length === 0 || !Array.isArray(req.genres)) {
      return err(400, 'VALIDATION_ERROR', 'name, preferredLanguages and genres are required');
    }
    state.profile = { userId: MOCK_USER_ID, name: req.name.trim(), preferredLanguages: req.preferredLanguages, genres: req.genres };
    state.onboarded = true;
    return ok(state.profile);
  }

  if (method === 'GET' && path === '/recommendations') {
    if (!isMood(query.mood)) return err(400, 'VALIDATION_ERROR', `mood must be one of: ${MOOD_NAMES.join(', ')}`);
    const language = query.language as LanguageFilter | undefined;
    if (language && !['Hindi', 'English', 'Both'].includes(language)) {
      return err(400, 'VALIDATION_ERROR', 'language must be one of: Hindi, English, Both');
    }
    const limit = query.limit ? Number(query.limit) : 10;
    return ok({ songs: recommend(query.mood, language, limit), source: 'db' });
  }

  if (method === 'POST' && path === '/feedback') {
    const req = body as FeedbackRequest;
    if (!SONGS.some((s) => s.id === req?.songId)) return err(404, 'NOT_FOUND', 'Song not found');
    if (!['like', 'dislike', 'skip'].includes(req.type)) {
      return err(400, 'VALIDATION_ERROR', 'type must be one of: like, dislike, skip');
    }
    state.feedback = [...state.feedback.filter((f) => f.songId !== req.songId), { songId: req.songId, type: req.type, at: Date.now() }];
    return ok({ songId: req.songId, type: req.type });
  }

  if (method === 'GET' && path === '/feedback/liked') {
    const likes = state.feedback.filter((f) => f.type === 'like').sort((a, b) => b.at - a.at);
    const songs = likes.map((f) => SONGS.find((s) => s.id === f.songId)).filter((s): s is Song => Boolean(s));
    return ok({ songs });
  }

  return err(404, 'NOT_FOUND', `No mock for ${method} ${path}`);
}

// ---------------------------------------------------------------------------
// fetch-compatible entry point
// ---------------------------------------------------------------------------

export interface MockResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

/**
 * Drop-in for fetch(url, init). Accepts full URLs ("http://x/api/mood/analyze")
 * or paths ("/mood/analyze"); everything up to and including "/api" is ignored.
 */
export async function mockFetch(
  url: string,
  init: { method?: string; body?: string | null } = {}
): Promise<MockResponse> {
  const method = (init.method ?? 'GET').toUpperCase();
  const [rawPath, rawQuery = ''] = url.split('?');
  const apiIndex = rawPath.indexOf('/api/');
  const path = (apiIndex >= 0 ? rawPath.slice(apiIndex + 4) : rawPath).replace(/\/+$/, '') || '/';

  let body: unknown = undefined;
  if (init.body) {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = undefined;
    }
  }

  const reply = route(method, path, parseQuery(rawQuery), body);
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return {
    ok: reply.status >= 200 && reply.status < 300,
    status: reply.status,
    json: async () => JSON.parse(JSON.stringify(reply.body)),
  };
}
