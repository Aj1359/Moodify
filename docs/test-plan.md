# End-to-End Test Plan

Run in phase 6 on real phones against the deployed backend. Nobody tests their own screens: the Tester column assigns each area to someone else. Mark each result **Pass** or **Fail**, and post every failure in the group with its test ID so the owner can fix it.

| Area | Owner | Tester |
| --- | --- | --- |
| Auth, onboarding, Home, My Music, My Mood | Hirannya | Sanjani |
| Mood AI, Recommendations | Sanjani | Hirannya |
| Backend core, emotion service | Aditya J | Niraj |
| Recommendations engine, feedback, deployment | Niraj | Aditya J |
| Keyword fallback, validation, Profile, evaluation | Aditya KY | Aditya J |

## Before you start

- Backend deployed, URL set in the app's `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCKS=false`.
- Two test accounts (A and B), both through onboarding.
- `cd backend && npm test` passes.

## 1. Auth and profile

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| AUTH-01 | Sign up with a new email | Onboarding opens | |
| AUTH-02 | Finish onboarding (name, Hindi only, 2 genres) | Home opens; Profile shows the saved values | |
| AUTH-03 | Close the app fully and reopen it | Still logged in, Home opens | |
| AUTH-04 | Profile: change languages to both, save | Next recommendations include English songs | |
| AUTH-05 | Profile: log out | Login screen; back button does not return to tabs | |
| AUTH-06 | `curl <API>/api/preferences` with no token | 401 `UNAUTHORIZED` envelope | |

## 2. Mood detection

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| MOOD-01 | Mood AI: "had the best day, got my offer letter" | Happy, shown within 3 s | |
| MOOD-02 | "aaj bahut thak gaya hu, kuch relax wala sunna hai" | Relaxed | |
| MOOD-03 | "मुझे बहुत गुस्सा आ रहा है" | Angry | |
| MOOD-04 | "I am not happy at all" | Sad, not Happy | |
| MOOD-05 | Submit empty text, then 501 characters | Submit blocked, or a clear message; no crash | |
| MOOD-06 | Change the detected mood in the modal, confirm | Entry saved with the chosen mood (check My Mood) | |
| MOOD-07 | Double-tap submit quickly | Only one entry saved | |
| MOOD-08 | Mood wording on every screen | Shown as an estimate ("Sounds like..."), no clinical words | |

## 3. Failure handling (zero-crash target)

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| FAIL-01 | Set an invalid `LLM_API_KEY` on the backend, restart, analyse a mood | Still returns a mood (`source: keyword`); app works normally | |
| FAIL-02 | Stop the backend, open Recommendations | Error state with retry, or fallback songs; no crash | |
| FAIL-03 | Break `SUPABASE_URL` on the backend, request recommendations | `source: fallback` songs returned | |
| FAIL-04 | Turn on airplane mode, submit a mood | Clear offline message with retry; no crash | |

## 4. Recommendations and feedback

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| REC-01 | Confirm a mood | Up to 10 songs, each with a one-line reason | |
| REC-02 | Language filter: Hindi | Only Hindi songs | |
| REC-03 | Dislike a song | It disappears at once and never comes back for any mood | |
| REC-04 | Like a song | It is first in My Music | |
| REC-05 | Tap a song | YouTube opens the right song | |
| REC-06 | Home: tap a mood chip | Recommendations for that mood; no new entry in My Mood | |
| REC-07 | Like two songs by one artist, then reload a mood they fit | That artist ranks higher | |

## 5. History and privacy

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| HIST-01 | Open My Mood | Weekly counts for all 8 moods; entries newest first | |
| HIST-02 | Delete one entry | Gone after refresh; counts update | |
| HIST-03 | Delete all | Asks for confirmation first; list empty after | |
| PRIV-01 | As user B, `DELETE /api/mood/<A's entry id>` | 404 `NOT_FOUND`; A's entry still exists | |
| PRIV-02 | As user B, open My Mood | None of A's entries visible | |

## 6. Performance and quality

| ID | Steps | Expected | Result |
| --- | --- | --- | --- |
| PERF-01 | Stopwatch from tapping submit to a playable song list | Under 10 s | |
| PERF-02 | `npm run eval:llm`: latency row | p95 under 3 s | |
| NLP-01 | `npm run eval:llm`: accuracy row | At least 80% | |
| NLP-02 | `npm test` in `backend/` | All pass | |
| UX-01 | Visit every screen with no data, slow network, and an error | Each shows an empty, loading and error state | |
