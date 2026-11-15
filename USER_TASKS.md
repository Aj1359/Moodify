# Moodify: Project Status and Team Roadmap

**Project:** Moodify, a multilingual (English, Hindi, Hinglish) mood-to-music recommendation app
**Stack:** React Native (Expo Router) · Node.js 22 / Express · Supabase (Postgres, Auth, RLS) · Google Gemini
**Last updated:** 16 November 2026 (LLM evaluation done)

This file tracks who owns what and what is left. The decisions everyone builds against are in the Team Guide (PDF in the repo root) and the API contract in [docs/api.md](docs/api.md). If this file and those disagree, the guide and the contract win.

---

## 1. Done (merged into `main`)

### Backend and LLM: Aditya Jha
- [x] Supabase clients and JWT auth middleware (`middlewares/auth.js`): `Bearer` token checked with `supabase.auth.getUser()`, `req.user = { id, email }`, 401 `UNAUTHORIZED` otherwise.
- [x] Gemini emotion service (`services/emotionService.js`): JSON mode, few-shot prompt, 3 s timeout with `AbortController`, output validated against the contract, keyword fallback on any failure. Never rejects.
- [x] Mood endpoints: `POST /api/mood/analyze`, `POST /api/mood/confirm`, `GET /api/mood/history` (with weekly counts), `DELETE /api/mood/:id` (one entry or `all`).
- [x] Preferences endpoints: `GET /api/preferences` (404 `PROFILE_NOT_FOUND` before onboarding), `PUT /api/preferences`.
- [x] Supabase schema with row-level security and indexes (`supabase/migrations/`).
- [x] Environment templates (`.env.example`, `backend/.env.example`, `mobile/.env.example`); secrets kept out of git.

### Recommendations and data: Niraj Chandekar
- [x] Scoring engine (`utils/scoring.js`): `0.5 · MoodMatch + 0.3 · LanguageMatch + 0.2 · FeedbackBoost`, with a reason of 60 characters or fewer for every song.
- [x] Recommendation service (`services/recommendationService.js`): profile languages and genres, like-based boosts, dislikes removed, offline fallback pool when the database is unavailable.
- [x] `GET /api/recommendations`, `POST /api/feedback` (one row per user and song), `GET /api/feedback/liked`.
- [x] 120-song catalog with official YouTube links; seed loader (`npm run seed`) and offline demo (`scripts/demoRecommendations.js`).

### Mobile, mood to music: Sanjani Kumari
- [x] Typed API client (`services/api.ts`) with the mock backend switch (`EXPO_PUBLIC_USE_MOCKS`).
- [x] Mood AI screen: type a feeling, see the detected mood, confirm or change it.
- [x] Recommendations screen with `SongCard`, `MoodChip` and like / dislike / skip `FeedbackButtons`; songs open on YouTube.
- [x] Hooks `useMood` and `useRecommendations`.

### Mobile, auth and dashboards: Hirannya Mhaisbadwe
- [x] Dark theme (`constants/theme.ts`).
- [x] Login and sign-up (responsive mobile and desktop layouts, no OAuth).
- [x] Onboarding ("Tune Your Taste": name, languages, genres) and the session gate (login → onboarding the first time → tabs).
- [x] Home, My Music (liked songs), My Mood (weekly counts, history, delete) and Profile screens.

### NLP evaluation, contract and QA: Aditya Kumar Yadav
- [x] API contract (`docs/api.md`) and shared TypeScript types (`mobile/src/types`), plus request validation (`middlewares/validate.js`) and the snake_case ↔ camelCase mappers (`utils/mappers.js`).
- [x] Rule-based multilingual classifier (`services/keywordFallback.js`): 775-term lexicon in English, Hindi and Hinglish; clause-aware negation; emoji cues; under 1 ms per call.
- [x] 144-sentence trilingual benchmark and evaluation harness (`npm run eval`, `npm run eval:llm`): keyword baseline 71.5% top-1, 95.1% when a cue is found.
- [x] Full-pipeline evaluation: **97.9%** top-1 against the 80% target, with error analysis, prompt tuning and model comparison ([docs/evaluation.md](docs/evaluation.md)); default model switched to `gemini-3.5-flash-lite`; hard 3 s deadline on Gemini calls.
- [x] Mock backend for the app (`services/mocks.ts`), end-to-end test plan ([docs/test-plan.md](docs/test-plan.md)), README.
- [x] Backend hardening: JSON errors on every path, database errors mapped to contract codes, Gemini parsing fixes.
- [x] GitHub Actions CI: backend tests, keyword evaluation and mobile type check on every pull request.

**Quality today:** 80 backend tests (79 pass; the live Gemini benchmark is skipped without a key), strict TypeScript passes, CI is green, LLM pipeline at 97.9% on the benchmark.

---

## 2. Remaining work, by owner

The order matters: rows marked *needs* wait on the step they name.

### Aditya Jha
| # | Task | Details |
| :--- | :--- | :--- |
| 1 | ~~Share the Gemini key for local evaluation~~ | Done. Keep `LLM_MODEL=gemini-3.5-flash-lite`: the `gemini-2.5-flash` free tier allows only 20 requests a day. |
| 2 | Set up the real Supabase project | Run the migration, then `npm run seed` to load the 120 songs. |
| 3 | ~~Prompt tuning~~ | Done: two general rules (Romantic for joy about a person or date; apathy is Sad, not Relaxed) took the pipeline from 97.2% to 97.9%. Review them in `emotionService.js`. |
| 4 | Record the demo video | *Needs the deployed backend and the Android build.* |

### Niraj Chandekar
| # | Task | Details |
| :--- | :--- | :--- |
| 1 | Deploy the backend (e.g. Render) | *Needs Supabase set up.* Node 22 (`engines` in `package.json`), all `backend/.env` values as host secrets, health check on `/health`. |
| 2 | Compile the project report | Collect each member's chapter into one document. |

### Sanjani Kumari
| # | Task | Details |
| :--- | :--- | :--- |
| 1 | Point the app at the deployed backend | `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCKS=false`; run the mood → songs flow once against real data. |
| 2 | Fix bugs found in the test session | Mood AI and Recommendations screens. |
| 3 | Report section and slides | Mood-to-music flow and API client. |

### Hirannya Mhaisbadwe
| # | Task | Details |
| :--- | :--- | :--- |
| 1 | Android build | Add `mobile/eas.json` and build an APK with EAS (or share via Expo Go) against the deployed backend. |
| 2 | Fix bugs found in the test session | Auth, onboarding and dashboard screens. |
| 3 | Report section and slides | App design and screens. |

### Aditya Kumar Yadav
| # | Task | Details |
| :--- | :--- | :--- |
| 1 | ~~LLM evaluation and error analysis~~ | Done: 97.9% top-1, macro-F1 0.979, p95 1.5 s ([docs/evaluation.md](docs/evaluation.md)). Re-run only if the prompt changes; each run uses 144 of the 500 free daily requests. |
| 2 | End-to-end test session on real phones | *Needs the deployed backend and the build.* Run [docs/test-plan.md](docs/test-plan.md) with swapped testers; file bugs to owners. |
| 3 | Report chapter: NLP methodology and evaluation | Pipeline, classifier design, benchmark, results, error analysis. |
| 4 | Slide deck | Collect everyone's slides into one deck. |
| 5 | Release | Merge the last pull requests, tick the README status, tag `v1.0`. |

---

## 3. Out of scope for v1 (decided)

These came up but are not part of this release. They stay listed so they are not re-opened mid-sprint.

| Idea | Why not now |
| :--- | :--- |
| Spotify or other music API, 30 s previews, album art | Songs open as YouTube links (Team Guide). No API keys, quotas or licensing to manage. |
| In-app audio player (`expo-av`), visualizer | Same reason: playback happens in the YouTube app. |
| Voice input for moods | Needs speech-to-text in Hindi and Hinglish; out of the 2-day scope. |
| Time-of-day or weather context in the prompt | Not measurable on the benchmark; risks the 80% target. |

## 4. Improvements if time allows

| Area | Improvement | Owner if picked up |
| :--- | :--- | :--- |
| Backend | Rate limit `POST /api/mood/analyze` (e.g. `express-rate-limit`, 10 per minute per user) to protect the Gemini quota | Aditya Jha |
| Backend | Restrict CORS to the deployed app origins | Niraj Chandekar |
| Backend | Cache repeated mood texts for a few minutes to cut LLM calls | Aditya Jha |
| Database | Composite index `mood_entries(user_id, created_at DESC)` for history queries | Aditya Jha |
| Mobile | Skeleton loading states on Mood AI and Recommendations | Sanjani Kumari |
| Mobile | Haptics on mood chips and feedback buttons (`expo-haptics`) | Hirannya Mhaisbadwe |
| Mobile | Cache the last recommendations with `AsyncStorage` so the app opens offline | Sanjani Kumari |

## 5. Next steps, in order

1. **Aditya Jha:** Supabase project set up and seeded. (LLM evaluation and prompt tuning are done: 97.9%.)
2. **Aditya Jha:** review the two new prompt rules in `emotionService.js`.
3. **Niraj:** deploy the backend. **Hirannya:** Android build. **Sanjani:** app on the real backend.
4. **Everyone:** test session from the test plan; owners fix their bugs.
5. **Aditya Jha:** demo video. **Niraj:** report. **Aditya Kumar Yadav:** slides, README, `v1.0` tag.
