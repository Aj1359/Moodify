# Changelog

## v1.0.0 (16 November 2026)

First complete release of Moodify: type how you feel in English, Hindi or Hinglish and get a ranked list of Hindi and English songs.

### NLP
- Two-stage mood detection: Gemini (`gemini-3.5-flash-lite`, JSON mode, few-shot prompt) with a rule-based multilingual fallback (775-term lexicon, clause-aware negation, emoji cues, under 1 ms).
- **97.9%** top-1 accuracy on a 144-sentence trilingual benchmark (target 80%); 71.5% for the fallback alone. Full results in [docs/evaluation.md](docs/evaluation.md).
- Hard 3 s deadline on every Gemini call; quota guard with a 10-minute answer cache, 10 calls per user per minute and a daily cap. Over a limit, or on any Gemini failure, the keyword fallback answers, so the app never shows an error.

### Backend (Node 22, Express, Supabase)
- Endpoints: mood analyse / confirm / history / delete, preferences, recommendations, feedback, liked songs ([docs/api.md](docs/api.md)).
- Recommendation scoring on mood, language and liked artists or genres; disliked songs are excluded; a 20-song offline pool when the database is unavailable.
- 120-song Hindi and English catalog with fixed ids and YouTube links; `npm run seed`.
- JSON error envelope on every path, request validation, Supabase JWT auth, row-level security.
- CORS allow-list (`CORS_ORIGINS`), Render blueprint (`render.yaml`).

### App (Expo SDK 51)
- Login, sign-up, onboarding, Home, Mood AI with mood confirmation, Recommendations with like / dislike / skip, My Music, My Mood (weekly chart, history, delete) and Profile.
- Built-in mock backend (`EXPO_PUBLIC_USE_MOCKS=true`) for offline demos.
- App icon and splash screen; EAS build profiles for an APK against the real backend or fully offline.

### Quality
- 87 backend tests, strict TypeScript, CI on every pull request (backend tests, keyword evaluation, mobile type check).
- Deployment and demo guide: [docs/deployment.md](docs/deployment.md). End-to-end test plan: [docs/test-plan.md](docs/test-plan.md).
