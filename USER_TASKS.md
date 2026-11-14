# Moodify — Project Status & Team Roadmap (USER_TASKS.md)

**Project:** Moodify (AI-Powered Multilingual Mood-to-Music Recommendation App)  
**Tech Stack:** React Native (Expo Router) + Node.js / Express + Supabase PostgreSQL + Google Gemini LLM  
**Repository Status:** Up-to-date on `main` branch · Secrets sanitised · Live build verified  
**Last Updated:** November 2026  

---

## 1. What Has Been Done (Shipped & Pushed)

### A. Backend & AI Layer (Aditya Jha)
- [x] **Gemini 2.5 Flash Emotion Extraction Service** (`backend/src/services/emotionService.js`):
  - Multilingual emotion extraction from free-text inputs in English, Hindi, and Hinglish.
  - Strict 3000ms timeout (`Promise.race`) with automatic fallback to a local keyword/regex scoring engine.
  - Safe extraction of `emotion`, `energy` (low/medium/high), `intensity`, `context`, and target mood mapping.
- [x] **Supabase JWT Authentication Middleware** (`backend/src/middlewares/auth.js`):
  - Validates `Bearer <token>` against `supabase.auth.getUser()`.
  - Attaches `req.user` (`id`, `email`) to protected routes; gracefully denies unauthenticated requests with `401 Unauthorized`.
- [x] **Standardized Error Handling** (`backend/src/middlewares/errorHandler.js`):
  - Strict JSON error envelopes `{ error: { code, message, details } }`.
  - Sanitized 500 `INTERNAL_ERROR` preventing leak of backend stack traces.
- [x] **Controllers & Routes**:
  - `POST /api/mood/analyze` — Analyzes user's raw text and returns emotion tags.
  - `POST /api/mood/confirm` — Commits confirmed mood into user history.
  - `GET /api/mood/history` — Paginated history with weekly mood aggregation counts.
  - `DELETE /api/mood/:id` — Soft/hard delete for single entry or clear-all.
  - `GET /api/preferences` & `PUT /api/preferences` — User profile, preferred languages, and favorite genres.
- [x] **Test Harness**:
  - 42 tests (`backend/tests/emotionService.test.js`) verifying edge-case handling, JSON extraction, multilingual phrases, timeout triggers, and fallback accuracy.

### B. Frontend & UI/UX (Hirannya)
- [x] **Luxury Dark Theme Foundation** (`mobile/src/constants/theme.ts`):
  - Midnight palette (`#090712`, `#130F24`, `#1A1530`, `#22C55E`, `#FF4B72`, `#8B5CF6`).
- [x] **Login Screen Redesign** (`mobile/app/(auth)/login.tsx`):
  - **Mobile (< 768px)**: Centered layout matching reference image with glowing gradient orb, "Login to Your Account", rounded pill inputs (with ✉️ mail, 🔒 password, 👁️ toggle), custom "Remember Me" checkbox, and vibrant pill CTA.
  - **Desktop (≥ 768px)**: Split-screen luxury card with clean form on the left and an atmospheric dark audio visualization panel on the right.
  - **Zero OAuth**: Removed all 3rd-party OAuth providers (Google, Apple, Facebook) as requested.
  - **No Hardcoded Moods**: Removed static mood tag chips (`Relaxed`, `Happy`, etc.) from visual panels.
- [x] **Sign Up Screen Redesign** (`mobile/app/(auth)/signup.tsx`):
  - Consistent split-screen desktop & pill-shaped mobile layout with password confirmation, terms checkbox, and direct login flow.
- [x] **Onboarding Screen ("Tune Your Taste")** (`mobile/app/(auth)/onboarding.tsx`):
  - Matches user reference design for both Desktop and Mobile.
  - Stepper navigation: `✓ Account` ──── `② Your Taste`.
  - Desktop Left Panel: Glowing illuminated 3D headphones, equalizer visualizer, bold headline **Make It <span style="color:#22C55E">Yours</span>**, and 3 feature callouts (Personalized Picks, Learns Your Vibe, Your Music Your Way).
  - Glassmorphic Main Card: Nickname input (`👤`), custom language chips (`अ आ Hindi ✓`, `🌐 English ✓`), and multi-select genre grid with reference icons (`🎬 Bollywood`, `🎶 Indie Pop`, `🎧 Lo-Fi`, `🎸 Rock`, etc.).
  - Neon green CTA pill: `Get Started 🚀 →`.
- [x] **Navigation Gate & Access Control** (`mobile/app/_layout.tsx` & `AuthContext.tsx`):
  - **Strict Login-Only Landing**: App boots to `/(auth)/login`.
  - **Session Lock**: Any unauthenticated access to `/(auth)/onboarding` or `/(tabs)` is automatically blocked and redirected to `/(auth)/login`.
  - Smooth progression: `Login` → `Onboarding` (first time) → `Main Dashboard Tabs`.
- [x] **Tab Navigation Shell**:
  - `(tabs)/index.tsx` (Home / Mood Input)
  - `(tabs)/music.tsx` (Recommendations & Player)
  - `(tabs)/history.tsx` (Mood Trends & Weekly History)
  - `(tabs)/profile.tsx` (User Settings & Sign Out)

### C. Security & Secrets Protection
- [x] Secrets scrubbed from git history; `.gitignore` enforced for `.env`, `*.pem`, `serviceAccountKey.json`.
- [x] Clear templates provided in `.env.example`, `backend/.env.example`, and `mobile/.env.example`.

---

## 2. What Needs To Be Done (Priority Roadmap — Member-Wise)

### 🧑‍💻 Aditya Jha (Backend, Data & AI Lead)
| Priority | Task Description | Target File / Area | Details |
| :--- | :--- | :--- | :--- |
| **P0** | **Spotify / Music API Integration** | `backend/src/services/musicService.js` | Fetch real tracks, 30s audio preview URLs, album art, and artist info via Spotify Web API or YouTube Music API. |
| **P0** | **Rate Limiting & Abuse Prevention** | `backend/src/middlewares/rateLimiter.js` | Add `express-rate-limit` (e.g. 10 mood requests/minute per IP/User) to prevent Gemini API quota exhaustion. |
| **P1** | **Supabase Database Schema & RLS** | `backend/supabase/migrations/` | Write and test SQL migration scripts for `profiles`, `mood_entries`, and `song_feedback` tables with Row Level Security (RLS) policies. |
| **P1** | **Recommendation Scoring Algorithm** | `backend/src/services/recommendationService.js` | Incorporate user preferences (languages, genres) and feedback history (likes/dislikes) into ranking weights. |
| **P2** | **Automated LLM Eval Pipeline** | `backend/tests/evals/` | Run real benchmark assertions against Gemini 2.5 Flash (`RUN_LLM_EVAL=1`) to measure classification accuracy on Hinglish idioms. |

---

### 🎨 Hirannya (Frontend, Mobile & UI/UX Lead)
| Priority | Task Description | Target File / Area | Details |
| :--- | :--- | :--- | :--- |
| **P0** | **Live Audio Player Component** | `mobile/src/components/AudioPlayer.tsx` | Implement background audio playback using `expo-av` for song previews with play/pause, scrub bar, and volume controls. |
| **P0** | **Home Tab Mood Submission Flow** | `mobile/app/(tabs)/index.tsx` | Connect text box + voice input button to `/api/mood/analyze`, display interactive mood confirmation modal before generating songs. |
| **P1** | **Song Recommendation Card Interactions** | `mobile/app/(tabs)/music.tsx` | Add Heart (Like), Thumbs Down (Dislike), and Skip actions with smooth animations and backend feedback sync. |
| **P1** | **Mood History Visualizations** | `mobile/app/(tabs)/history.tsx` | Build weekly mood distribution chart (bar/donut chart) and calendar heat-map of user emotions over time. |
| **P2** | **Haptic Feedback & Micro-Interactions** | `mobile/src/utils/haptics.ts` | Add subtle haptic vibrations (via `expo-haptics`) when selecting chips, liking songs, and submitting moods. |

---

### 🛡️ Rani / Fullstack QA & DevOps
| Priority | Task Description | Target File / Area | Details |
| :--- | :--- | :--- | :--- |
| **P0** | **Backend Deployment** | `backend/Dockerfile` / Render / Fly.io | Deploy Node.js Express backend to cloud with environment secrets and healthcheck endpoint (`/health`). |
| **P0** | **EAS Build Configuration (Android APK)** | `mobile/eas.json` | Set up Expo Application Services (EAS) build profile to compile standalone Android `.apk` / `.aab` for real device testing. |
| **P1** | **GitHub Actions CI/CD Pipeline** | `.github/workflows/ci.yml` | Automate backend unit tests, linter checks, and Expo web export on every pull request to `main`. |
| **P2** | **CORS & Domain Security Audit** | `backend/src/server.js` | Restrict allowed origins to production domains and Expo localhost development ports. |

---

## 3. Targeted Improvements (UI, Services, Reliability)

### A. UI / UX Improvements
1. **Interactive Audio Visualizer**:
   - Add a glowing wave visualizer in the Player Bar that reacts dynamically during track playback.
2. **Skeleton & Shimmer Loading States**:
   - Replace generic spinners with dark shimmering skeletons while Gemini processes mood and while song lists load.
3. **Voice Input for Mood Expression**:
   - Enable mic button on the Home tab allowing users to speak their thoughts in Hindi/English (using Web Speech API / Expo Speech).

### B. Service & AI Layer Improvements
1. **Context-Aware Mood Synthesis**:
   - Enhance the prompt to detect time-of-day (e.g. late night, early morning) and weather context to fine-tune recommendation tempo.
2. **Smart Caching Layer**:
   - Cache frequent emotion classifications (e.g. "feeling low today", "gym workout energy") using an in-memory or Redis LRU cache to reduce LLM latency to <50ms.
3. **Direct Open-in-App Deeplinks**:
   - Include direct deeplinks (`spotify://track/...`, `https://open.spotify.com/...`) so users can seamlessly save curated songs directly to their personal Spotify library.

### C. Architecture & Database Improvements
1. **PostgreSQL Indexes**:
   - Index `mood_entries(user_id, created_at DESC)` for sub-millisecond retrieval of user history.
2. **Offline-First Storage**:
   - Cache recent recommendations and profile settings locally using `AsyncStorage` / `MMKV` so the app opens instantly without network delay.

---

## 4. Immediate Next Steps

1. **Aditya**: Implement `backend/src/services/musicService.js` with Spotify API credentials.
2. **Hirannya**: Wire the `AudioPlayer` into `mobile/app/(tabs)/music.tsx`.
3. **DevOps**: Configure `.github/workflows/ci.yml` to run test suites on commit.
