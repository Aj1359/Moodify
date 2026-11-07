# Moodify 🎵

> **Feel it. Express it. Play it.**  
> *Go from "how I feel" to a fitting, personalised song list in under 10 seconds.*

---

## 📖 Overview

**Moodify** is an AI-powered music recommendation mobile application designed for students and young professionals who listen to Hindi, English, and Hinglish music.

Instead of browsing endless generic mood playlists, users describe how they feel in natural language (English, Hindi in Devanagari, or colloquial Hinglish). Moodify detects their emotion, allows quick confirmation/correction, and serves ranked song recommendations matching their vibe, preferred languages, and historical feedback.

---

## 🚀 Key Features (2-Day MVP)

- **Multilingual Mood Detection:** Express emotions naturally in English, Hindi (Devanagari), or Romanised Hinglish (e.g., *"aaj bahut thak gaya hu, kuch relax wala sunna hai"*).
- **LLM + Keyword Fallback:** Fast structured JSON mood extraction powered by LLMs with rule-based keyword fallback for offline/low-latency reliability.
- **Mood Confirmation & Correction:** Interactive UI allowing users to fine-tune or override detected mood categories.
- **Scoring & Recommendation Engine:**
  $$\text{Score}(s) = w_1 \cdot \text{MoodMatch} + w_2 \cdot \text{LanguageMatch} + w_3 \cdot \text{FeedbackBoost}$$
  *(Disliked songs are automatically excluded)*.
- **External Playback:** Seamless one-tap redirection to Spotify or YouTube.
- **Feedback Loop:** Like, dislike, and skip controls that continuously personalize recommendations.
- **Private Mood History:** Track weekly mood counts and trends with full data privacy and one-tap entry deletion.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Mobile App** | React Native + Expo (`expo-router`) | Cross-platform iOS & Android mobile client |
| **Backend** | Node.js + Express | RESTful API server & orchestration |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth) | User management, relational data, and row-level security |
| **AI / NLP** | LLM Structured Output + Keyword Engine | Emotion & energy parsing with Hinglish support |
| **Playback** | External Deep Links | Spotify & YouTube direct web/app links |
| **Deployment** | Render / Railway (Backend) & Expo Go / EAS (Mobile) | Cloud hosting & preview builds |

---

## 📁 Repository Structure

```text
Moodify/
├── README.md                               # Project documentation & MVP specifications
├── .gitignore                              # Root gitignore for Node & React Native
├── supabase/
│   └── migrations/
│       └── 20261108000000_init_schema.sql  # Supabase PostgreSQL schema & tables
│
├── backend/                                # Node.js + Express REST API
│   ├── .env.example                        # Backend environment variable template
│   ├── package.json                        # Backend dependencies & scripts
│   ├── src/
│   │   ├── server.js                       # Express application entrypoint
│   │   ├── config/
│   │   │   └── supabase.js                 # Supabase client configuration
│   │   ├── controllers/
│   │   │   ├── mood.controller.js          # Analyze, confirm, history endpoints
│   │   │   ├── recommendation.controller.js# Song recommendations logic
│   │   │   ├── feedback.controller.js      # Like, dislike, skip handlers
│   │   │   └── user.controller.js          # Preferences & profile handlers
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js          # Supabase JWT token verification
│   │   │   └── error.middleware.js         # Centralized error handler
│   │   ├── routes/
│   │   │   ├── mood.routes.js              # /api/mood routes
│   │   │   ├── recommendation.routes.js    # /api/recommendations routes
│   │   │   ├── feedback.routes.js          # /api/feedback routes
│   │   │   ├── user.routes.js              # /api/preferences routes
│   │   │   └── index.js                    # Route aggregator
│   │   ├── services/
│   │   │   ├── llm.service.js              # LLM prompt & structured JSON parsing
│   │   │   ├── fallback.service.js         # Keyword-based emotion fallback rules
│   │   │   └── recommendation.service.js   # Scoring formula & filtering
│   │   ├── utils/
│   │   │   └── scorer.js                   # Score calculation algorithms
│   │   └── data/
│   │       ├── songs.seed.json             # 120 curated seed songs (60 Hindi, 60 English)
│   │       └── fallback_songs.json         # Offline & failure fallback song list
│   └── tests/
│       ├── hinglish_eval.json              # 50+ benchmark sentences per language
│       └── emotion_detection.test.js       # Accuracy test suite for emotion detection
│
└── mobile/                                 # Expo React Native App (expo-router)
    ├── .env.example                        # Mobile environment variable template
    ├── app.json                            # Expo configuration
    ├── package.json                        # Mobile dependencies & scripts
    ├── tsconfig.json                       # TypeScript configuration
    ├── app/                                # File-based routing (expo-router)
    │   ├── _layout.tsx                     # Root layout (Auth provider, theme)
    │   ├── (auth)/                         # Authentication flow
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx                   # Login screen
    │   │   ├── signup.tsx                  # Sign-up screen
    │   │   └── onboarding.tsx              # Languages & genres selection
    │   ├── (tabs)/                         # Main app bottom tabs
    │   │   ├── _layout.tsx                 # Tab navigation bar
    │   │   ├── index.tsx                   # Home screen (greeting, chips, recent)
    │   │   ├── mood.tsx                    # Mood AI screen (text prompt, analysis)
    │   │   ├── music.tsx                   # My Music screen (liked songs)
    │   │   ├── history.tsx                 # My Mood screen (weekly counts, history)
    │   │   └── profile.tsx                 # Profile & Preferences screen
    │   └── recommendations.tsx             # Recommendations view & song cards
    └── src/
        ├── components/
        │   ├── SongCard.tsx                # Song item card with like/dislike/play
        │   ├── MoodChip.tsx                # Quick mood chip selector
        │   ├── FeedbackButtons.tsx         # Like, dislike, skip button set
        │   ├── MoodHistoryCard.tsx         # Mood entry log item with delete action
        │   └── EmotionConfirmationModal.tsx# Confirm / edit detected mood modal
        ├── context/
        │   └── AuthContext.tsx             # Supabase session & user state
        ├── hooks/
        │   ├── useMood.ts                  # Mood analysis hook
        │   └── useRecommendations.ts       # Recommendations fetch & feedback hook
        ├── services/
        │   ├── api.ts                      # Axios / Fetch client to Node backend
        │   └── supabase.ts                 # Supabase client instance
        ├── constants/
        │   ├── colors.ts                   # App color palette & dark/light theme
        │   └── moods.ts                    # 8 supported mood categories & icons
        └── types/
            └── index.ts                    # TypeScript types (Song, MoodEntry, etc.)
```

---

## 🗄 Database Schema (Supabase PostgreSQL)

### 1. `profiles`
Stores user profile attributes and onboarding preferences.
- `user_id` (`UUID`, PK, references `auth.users(id) on delete cascade`)
- `name` (`TEXT`)
- `preferred_languages` (`TEXT[]` e.g., `['Hindi', 'English']`)
- `genres` (`TEXT[]` e.g., `['Bollywood', 'Pop', 'Lo-Fi', 'Rock']`)
- `created_at` (`TIMESTAMPTZ`, default `now()`)

### 2. `songs`
Curated seed catalog of Hindi and English tracks.
- `id` (`UUID`, PK, default `gen_random_uuid()`)
- `title` (`TEXT`, NOT NULL)
- `artist` (`TEXT`, NOT NULL)
- `language` (`TEXT`, NOT NULL - `'Hindi'` | `'English'`)
- `genre` (`TEXT`, NOT NULL)
- `moods` (`TEXT[]`, NOT NULL - e.g. `['Happy', 'Relaxed']`)
- `energy` (`TEXT`, NOT NULL - `'low'` | `'medium'` | `'high'`)
- `url` (`TEXT`, NOT NULL - Spotify or YouTube link)

### 3. `mood_entries`
Logged user mood inputs with detected and confirmed classifications.
- `id` (`UUID`, PK, default `gen_random_uuid()`)
- `user_id` (`UUID`, references `profiles(user_id) on delete cascade`)
- `input_text` (`TEXT`, NOT NULL)
- `emotion` (`TEXT`)
- `energy` (`TEXT`)
- `intensity` (`TEXT`)
- `confirmed_mood` (`TEXT`, NOT NULL)
- `created_at` (`TIMESTAMPTZ`, default `now()`)

### 4. `song_feedback`
User feedback history to dynamically shape future recommendations.
- `id` (`UUID`, PK, default `gen_random_uuid()`)
- `user_id` (`UUID`, references `profiles(user_id) on delete cascade`)
- `song_id` (`UUID`, references `songs(id) on delete cascade`)
- `type` (`TEXT`, NOT NULL - `'like'` | `'dislike'` | `'skip'`)
- `created_at` (`TIMESTAMPTZ`, default `now()`)
- *Unique constraint on `(user_id, song_id)`*

---

## 🔌 API Endpoints Specification

All endpoints under `/api` require a valid Supabase JWT in the `Authorization: Bearer <token>` header (except health check).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/mood/analyze` | Accepts free text, returns structured emotion JSON (emotion, energy, intensity, target moods) |
| `POST` | `/api/mood/confirm` | Saves the confirmed mood entry and returns the ranked song recommendations |
| `GET` | `/api/mood/history` | Fetches user mood logs and weekly mood distribution counts |
| `DELETE`| `/api/mood/:id` | Deletes a specific mood entry (or pass `:id=all` to clear history) |
| `GET` | `/api/recommendations` | Directly query songs by mood, language, and user feedback boosts |
| `POST` | `/api/feedback` | Records user interaction (`like`, `dislike`, `skip`) on a song |
| `GET` | `/api/preferences` | Retrieves user's onboarding languages and genre preferences |
| `PUT` | `/api/preferences` | Updates user's language and genre preferences |

### Mood Detection JSON Response Example
```json
{
  "emotion": "exhaustion",
  "energy": "low",
  "intensity": "high",
  "context": "work_pressure",
  "target_moods": ["Relaxed", "Stressed"]
}
```

**Supported Target Mood Categories:**
`Happy`, `Sad`, `Angry`, `Stressed`, `Relaxed`, `Motivated`, `Romantic`, `Nostalgic`.

---

## 🎯 Recommendation Scoring Logic

$$Score(s) = (w_1 \cdot MoodMatch) + (w_2 \cdot LanguageMatch) + (w_3 \cdot FeedbackBoost)$$

- **Initial Weights:**
  - $w_1 = 0.5$ (Mood alignment)
  - $w_2 = 0.3$ (Language preference match)
  - $w_3 = 0.2$ (User feedback history: liked songs boosted)
- **Dislike Filter:** Any song previously marked as `dislike` by the user has its score set to $-\infty$ and is excluded from the results.
- **Fallbacks:** In the event of an external LLM failure or timeout (> 3s), the keyword rule engine categorizes the input, and cached fallback tracks are served to ensure zero app crashes.

---

## 🚦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Expo CLI](https://docs.expo.dev/) & [Expo Go app](https://expo.dev/client) on your physical phone (or Android Studio / Xcode emulator)
- A free [Supabase](https://supabase.com/) project

---

### 2. Database Setup (Supabase)
1. Go to your Supabase project dashboard -> **SQL Editor**.
2. Run the script located in `supabase/migrations/20261108000000_init_schema.sql`.
3. Enable **Email/Password Auth** under Authentication -> Providers.

---

### 3. Backend Setup
```bash
cd backend
npm install

# Copy environment variables and fill in your keys
cp .env.example .env

# Start development server
npm run dev
```

#### Backend `.env` Variables:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LLM_API_KEY=your-gemini-or-openai-api-key
LLM_MODEL=gemini-1.5-flash
```

---

### 4. Mobile App Setup
```bash
cd mobile
npm install

# Copy environment variables and configure
cp .env.example .env

# Start Expo dev server
npx expo start
```
Scan the QR code in your terminal using the **Expo Go** app on iOS/Android.

---

## ⏱ 2-Day MVP Development Plan

- **Day 1 (Backend, AI, Data):**
  - Supabase schema migrations and Auth configuration.
  - Curated seed catalog: 120 songs (60 Hindi, 60 English).
  - LLM emotion service with Hindi & Hinglish prompts + keyword fallback.
  - Recommendation scoring engine & feedback APIs.
  - Hinglish test suite (50+ benchmark sentences).
- **Day 2 (UI, Integration & Polish):**
  - Expo Router layout: Onboarding, Home, Mood AI, Recommendations, My Music, My Mood.
  - Like, Dislike, Skip UI integration with external Spotify/YouTube deep links.
  - Mood History & weekly analytics chart.
  - Latency profiling (< 3s response goal) and edge-case handling.
  - End-to-end testing and demo preparation.

---

## 📄 License
MIT
#   M o o d i f y  
 