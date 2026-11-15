# API Contract

This document is the single source of truth for the Moodify API. The TypeScript types for every request and response live in [`mobile/src/types/index.ts`](../mobile/src/types/index.ts). To change anything here, agree in the group first.

Base path: `/api`  
Auth: every endpoint needs `Authorization: Bearer <Supabase access token>`.

## Naming and allowed values

All JSON keys are **camelCase** in every request and response. The database keeps snake_case; the backend converts between the two only in `backend/src/utils/mappers.js`.

| Field | Allowed values |
| :--- | :--- |
| Mood (`confirmedMood`, `targetMoods`, a song's `moods`, the `mood` query) | `Happy`, `Sad`, `Angry`, `Stressed`, `Relaxed`, `Motivated`, `Romantic`, `Nostalgic` (Title Case, exactly these 8) |
| `energy`, `intensity` | `low`, `medium`, `high` |
| `emotion`, `context` | Free text, lowercase snake_case. Unknown: `neutral`, `general` |
| Song `language` | `Hindi`, `English` |
| `language` filter (query) | `Hindi`, `English`, `Both` |
| Feedback `type` | `like`, `dislike`, `skip` |
| Analysis `source` | `llm`, `keyword` |
| Recommendation `source` | `db`, `fallback` |
| Dates | ISO 8601 strings in UTC |
| IDs | UUID strings |

## Response format

Every endpoint returns exactly one of:

```json
{ "data": { } }
{ "error": { "code": "VALIDATION_ERROR", "message": "text must be 1-500 characters" } }
```

| HTTP | `code` | When |
| :--- | :--- | :--- |
| 400 | `VALIDATION_ERROR` | A field is missing or has a value not allowed above, or the body is not valid JSON |
| 413 | `VALIDATION_ERROR` | The body is larger than 16 kB |
| 401 | `UNAUTHORIZED` | Token missing, expired or invalid |
| 404 | `NOT_FOUND` | The mood entry or song does not exist, or is not yours; or the route does not exist |
| 404 | `PROFILE_NOT_FOUND` | The user has not finished onboarding; the app opens onboarding |
| 500 | `INTERNAL_ERROR` | Anything else. Never send stack traces |

Controllers pass database errors to `next(err)`; `backend/src/middlewares/errorHandler.js` maps them. A foreign-key error on `song_id` (for example `POST /feedback` with an unknown song) becomes `NOT_FOUND`, and one on `user_id` (saving a mood or feedback before onboarding) becomes `PROFILE_NOT_FOUND`. Routes under `/api/mood`, `/api/preferences`, `/api/recommendations` and `/api/feedback` check the token first, so an unknown path there answers 401 before 404.

A failed LLM call is **not** an error: `/mood/analyze` still returns 200, with `"source": "keyword"`.

**Request validation.** Every route uses `validate('<schema>')` from `backend/src/middlewares/validate.js`, which sends the 400 above. Handlers read the cleaned input from `req.valid.body`, `req.valid.query` and `req.valid.params` (trimmed, numbers parsed, defaults filled, unknown fields dropped), never from `req.body`. Schemas: `analyzeMood`, `confirmMood`, `moodHistory`, `deleteMood`, `updatePreferences`, `recommendations`, `feedback`.

## Endpoints

| Endpoint | Request | `data` in the response |
| :--- | :--- | :--- |
| `POST /mood/analyze` | `{ "text": "bahut stress ho raha hai" }` (1-500 characters after trimming) | `MoodAnalysisResult` |
| `POST /mood/confirm` | `{ "text", "confirmedMood", "analysis" }` where `analysis` is the object `/mood/analyze` returned, unchanged | `{ "entry": MoodEntry }` |
| `GET /mood/history?limit=20` | `limit` 1-100, default 20 | `{ "entries": MoodEntry[], "weeklyCounts": { "Happy": 2, ... } }`. Entries newest first; `weeklyCounts` covers the last 7 days and lists all 8 moods |
| `DELETE /mood/:id` | `:id` is a UUID, or `all` | `{ "deleted": 1 }` |
| `GET /preferences` | none | `UserProfile`, or 404 `PROFILE_NOT_FOUND` |
| `PUT /preferences` | `{ "name": "Aditi", "preferredLanguages": ["Hindi"], "genres": ["Lo-Fi"] }` | `UserProfile` (creates the profile if missing) |
| `GET /recommendations?mood=Relaxed&language=Both&limit=10` | `mood` required; `language` defaults to the profile's languages; `limit` 1-20, default 10 | `{ "songs": Song[], "source": "db" }`. Every song has `score` and `reason` |
| `POST /feedback` | `{ "songId": "<uuid>", "type": "like" }` | `{ "songId", "type" }`. One row per user and song; a new tap replaces the old one and its time. 404 `NOT_FOUND` for an unknown song |
| `GET /feedback/liked` | none | `{ "songs": Song[] }`, newest like first |

`/mood/confirm` only saves the entry. The Recommendations screen always loads songs itself with `GET /recommendations`, so songs come from one place.

## Backend function signatures

```js
// services/keywordFallback.js
keywordFallback(text)  // -> MoodAnalysisResult. Synchronous, < 50 ms, never throws. source: 'keyword'

// services/emotionService.js
analyzeMood(text)      // -> Promise<MoodAnalysisResult>. Never rejects.
                       //    Gemini first; keywordFallback on a 3 s timeout, an API error or invalid JSON

// services/recommendationService.js
getRecommendations({ userId, mood, language, limit = 10 })
                       // -> Promise<{ songs, source: 'db' | 'fallback' }>. Never rejects

// utils/scoring.js
scoreSong(song, { mood, languages, likedArtists, likedGenres })  // -> { score, reason }
```

- `targetMoods` holds 1-3 of the 8 moods, strongest first. `targetMoods[0]` is the mood the app shows as detected.
- If no keyword matches, the fallback returns `{ "emotion": "neutral", "energy": "medium", "intensity": "low", "context": "general", "targetMoods": ["Relaxed"], "source": "keyword" }`.

## Song catalog

- Every song has a fixed UUID (UUID v5 from its original short id, see `backend/scripts/assignSongIds.js`). The id is the same in `songs.seed.json`, the database and the fallback pool.
- Every song's `url` is a YouTube link, `https://www.youtube.com/watch?v=<id>`, from the official upload. The app opens it with `Linking.openURL(url)`.
