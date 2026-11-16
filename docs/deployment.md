# Deployment and Demo Guide

From an empty Supabase account to an Android APK on a phone. Do the steps in order; each ends with a check. Allow about an hour the first time.

| Step | Owner | Needs |
| --- | --- | --- |
| [1. Supabase project](#1-supabase-project) | Aditya Jha | A Supabase account |
| [2. Load the songs](#2-load-the-songs) | Aditya Jha | Step 1 |
| [3. Backend on Render](#3-backend-on-render) | Niraj Chandekar | Steps 1-2, a Render account, the Gemini key |
| [4. App against the real backend](#4-app-against-the-real-backend) | Sanjani Kumari | Step 3 |
| [5. Android APK](#5-android-apk) | Hirannya Mhaisbadwe | Step 3, an Expo account |
| [6. Before the demo](#6-before-the-demo) | Aditya Kumar Yadav | Steps 1-5 |

Secrets (the service role key and the Gemini key) go only into `backend/.env` and Render. Never into the app, git or chat.

## 1. Supabase project

1. [supabase.com](https://supabase.com) → **New project**. Region: **South Asia (Mumbai)**. Save the database password somewhere safe.
2. **SQL Editor** → run each file in [`supabase/migrations/`](../supabase/migrations) in name order:
   1. `20261108000000_init_schema.sql`: tables, row-level security, indexes
   2. `20261116000000_history_index.sql`: faster history and liked-songs queries

   Or, with the Supabase CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. **Authentication → Sign In / Providers → Email**: turn **Confirm email** off for the demo, so testers can log in straight after signing up.
4. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key.

**Check:** Table Editor shows `profiles`, `songs`, `mood_entries` and `song_feedback`, each with RLS enabled.

## 2. Load the songs

```bash
cd backend
cp .env.example .env    # fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, LLM_API_KEY
npm ci
npm run seed            # upserts the 120 songs with their fixed ids; safe to re-run
npm run dev             # http://localhost:5000/health -> {"status":"ok"}
```

**Check:** the `songs` table has 120 rows. In the app, recommendations show `"source": "db"`, not `"fallback"`.

## 3. Backend on Render

1. Push `main` to GitHub (already done).
2. [render.com](https://render.com) → **New → Blueprint** → pick the `Moodify` repository. Render reads [`render.yaml`](../render.yaml): Node 22, `backend/` folder, health check on `/health`.
3. Fill the four secrets it asks for: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `LLM_API_KEY`. The model and the quota limits are already set.
4. **Apply**. The first deploy takes about 3 minutes.

**Check:**

```bash
curl https://<service>.onrender.com/health                         # 200 {"status":"ok", "llm": {"configured": true, ...}}
curl https://<service>.onrender.com/api/recommendations?mood=Happy # 401 UNAUTHORIZED (auth works)
```

**Cold starts.** The free plan sleeps after 15 minutes without traffic, and the first request then takes 30-60 s. Open `/health` a minute before any demo or test session.

## 4. App against the real backend

`mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_API_BASE_URL=https://<service>.onrender.com/api
EXPO_PUBLIC_USE_MOCKS=false
```

```bash
cd mobile && npm ci && npx expo start    # scan the QR code with Expo Go
```

**Check:** sign up → onboarding → type "aaj bahut khush hu" → Happy → confirm → songs with reasons → a song opens on YouTube → like it → it appears in My Music.

## 5. Android APK

Profiles are in [`mobile/eas.json`](../mobile/eas.json): `preview` (real backend) and `demo-offline` (built-in mock data, no backend or internet needed).

```bash
npm install -g eas-cli
cd mobile
eas login                  # the team's Expo account
eas init                   # links the project; commit the projectId it adds to app.json
```

Cloud builds do not upload `mobile/.env` (it is gitignored), so give EAS the public values once: expo.dev → project → **Environment variables** → environment **preview** → add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and `EXPO_PUBLIC_API_BASE_URL` (visibility: plain text; none of them is secret).

```bash
eas build -p android --profile preview         # ~15 min in the cloud; prints an install link and QR code
eas build -p android --profile demo-offline    # optional backup APK that works without any backend
```

**Check:** install the APK on two phones (allow "install unknown apps") and repeat the check from step 4.

## 6. Before the demo

- [ ] Open `https://<service>.onrender.com/health` to wake the backend.
- [ ] Gemini quota: [ai.dev/rate-limit](https://ai.dev/rate-limit). `gemini-3.5-flash-lite` allows 500 requests a day; the backend stops at 450 (`LLM_DAILY_LIMIT`) and answers from keywords after that. Do not run `npm run eval:llm` on demo day: it uses 144.
- [ ] A demo account that has finished onboarding, plus a few confirmed moods, so My Mood has a chart.
- [ ] Sentences to show, one per language:
  - English: "rent is due and my salary hasn't come yet" → Stressed. There is no mood word: the keyword fallback alone says Relaxed, the LLM gets it right. A good before/after.
  - Hindi: "आज बहुत ख़ुशी हो रही है" → Happy
  - Hinglish: "yaar exam ke baad full chill mode" → Relaxed
- [ ] Show the fallback: in mock mode, add `#fallback` to the text. On the real backend, the answer's `source` is `keyword` whenever Gemini is slow or down.
- [ ] Backup: the `demo-offline` APK on one phone.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Every request is 401 | The app's anon key or URL is from another project | Copy both again from Project Settings → API |
| App always opens onboarding | No `profiles` row (404 `PROFILE_NOT_FOUND`) | Finish onboarding once; check `PUT /api/preferences` in the Render logs |
| Recommendations say `"source": "fallback"` | Songs not loaded, or the backend cannot reach Supabase | Run `npm run seed`; check `SUPABASE_URL` and the service role key on Render |
| Mood answers always `"source": "keyword"` | No Gemini key, wrong model, or quota used up | Open `/health`: `llm.configured: false` means `LLM_API_KEY` is not set on Render; otherwise `llm.lastFallback.reason` says why (for example `Gemini API error 403` for a bad key, `429` for quota, `404` for a wrong `LLM_MODEL`) |
| "This link is not supported" when playing a song | APK built before the song-link fix | Rebuild the APK from `main` |
| YouTube says "Video unavailable" for a song | The upload was removed or made private | `cd backend && npm run links` lists dead links; `npm run links -- --fix` swaps them for a YouTube search, then `npm run seed` updates Supabase (no app rebuild needed) |
| Backend crashes at start with "native WebSocket not found" | Node older than 22 | `NODE_VERSION=22` (set by `render.yaml`) |
| Web build: browser blocks requests (CORS) | `CORS_ORIGINS` set without the web origin | Add the origin, or leave `CORS_ORIGINS` empty |
| APK cannot reach the backend | `EXPO_PUBLIC_API_BASE_URL` missing in the EAS environment | Add it under the **preview** environment and rebuild |
