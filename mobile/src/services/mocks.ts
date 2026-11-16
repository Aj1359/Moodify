/**
 * Contract-accurate mock backend for building the app before the API is live.
 *
 * `mockFetch` is a drop-in replacement for `fetch`: same arguments, and it
 * answers every endpoint in docs/api.md with the same status codes and
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
  {
    "id": "c2771016-ab21-54ff-885d-63f8038fa64d",
    "title": "Ilahi",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Bollywood",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=fdubeMFwuGs"
  },
  {
    "id": "8bd3758f-cbc9-5f9b-ae32-5c26cacc6343",
    "title": "Kabira",
    "artist": "Tochi Raina, Rekha Bhardwaj",
    "language": "Hindi",
    "genre": "Sufi Pop",
    "moods": [
      "Nostalgic",
      "Sad",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=jHNNMj5bNQw"
  },
  {
    "id": "2a8fe43a-afba-569c-8a90-d5f5b97f7a2f",
    "title": "Channa Mereya",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Bollywood Soul",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=284Ov7ysmfA"
  },
  {
    "id": "71c8e6d6-d093-5fb5-b366-b71d78135ae9",
    "title": "Kar Gayi Chull",
    "artist": "Badshah, Neha Kakkar",
    "language": "Hindi",
    "genre": "Party Dance",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=NTHz9ephYTw"
  },
  {
    "id": "cf1b0bca-9834-545e-bef8-1562ac11ae98",
    "title": "Zinda",
    "artist": "Siddharth Mahadevan",
    "language": "Hindi",
    "genre": "Rock",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Zinda+Siddharth+Mahadevan"
  },
  {
    "id": "af678b2c-ad2c-572b-93d5-6fa9b177f394",
    "title": "Kun Faya Kun",
    "artist": "A.R. Rahman, Javed Ali, Mohit Chauhan",
    "language": "Hindi",
    "genre": "Sufi",
    "moods": [
      "Relaxed",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=T94PHkuydcw"
  },
  {
    "id": "b83ae5e8-aa56-5a8f-994b-aabe41096956",
    "title": "Apna Bana Le",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=ElZfdU54Cp8"
  },
  {
    "id": "bac90aee-b629-559e-9322-9452406073e6",
    "title": "Tum Hi Ho",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Sad"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=Umqb9KENgmk"
  },
  {
    "id": "93a63e5b-32e5-5589-a32d-2cc24a4bad02",
    "title": "Ghungroo",
    "artist": "Arijit Singh, Shilpa Rao",
    "language": "Hindi",
    "genre": "Pop",
    "moods": [
      "Happy",
      "Relaxed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=qFkNATtc3mc"
  },
  {
    "id": "40f8055c-e239-5d8a-a808-ff2e179449b3",
    "title": "Bhaag D.K. Bose",
    "artist": "Ram Sampath",
    "language": "Hindi",
    "genre": "Punk Rock",
    "moods": [
      "Angry",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Bhaag+D.K.+Bose+Ram+Sampath"
  },
  {
    "id": "77a035bb-ffb6-516d-a17c-90959a9d3859",
    "title": "Agar Tum Saath Ho",
    "artist": "Alka Yagnik, Arijit Singh",
    "language": "Hindi",
    "genre": "Melancholy",
    "moods": [
      "Sad",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=sK7riqg2mr4"
  },
  {
    "id": "aef90e1f-2dc8-54f4-b4d4-16e3bb890a05",
    "title": "Sooraj Dooba Hain",
    "artist": "Arijit Singh, Aditi Singh Sharma",
    "language": "Hindi",
    "genre": "EDM / Dance",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Sooraj+Dooba+Hain+Arijit+Singh"
  },
  {
    "id": "20a7cfd2-125d-5dfa-bcc3-7296a2f1142e",
    "title": "Phir Le Aya Dil",
    "artist": "Rekha Bhardwaj",
    "language": "Hindi",
    "genre": "Ghazal Pop",
    "moods": [
      "Nostalgic",
      "Sad"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Phir+Le+Aya+Dil+Rekha+Bhardwaj"
  },
  {
    "id": "019aaad2-c29b-5383-8218-660b5cea4e08",
    "title": "Sadda Haq",
    "artist": "Mohit Chauhan",
    "language": "Hindi",
    "genre": "Hard Rock",
    "moods": [
      "Angry",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=p9DQINKZxWE"
  },
  {
    "id": "60148c7e-28bf-5f75-b470-79dcf922bc1f",
    "title": "Matargashti",
    "artist": "Mohit Chauhan",
    "language": "Hindi",
    "genre": "Pop",
    "moods": [
      "Happy",
      "Relaxed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=6vKucgAeF_Q"
  },
  {
    "id": "fca3f7f1-3ba1-56d6-b348-d7b8f253a784",
    "title": "Iktara",
    "artist": "Kavita Seth, Amitabh Bhattacharya",
    "language": "Hindi",
    "genre": "Indie Pop",
    "moods": [
      "Relaxed",
      "Romantic",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=fSS_R91Nimw"
  },
  {
    "id": "9fa13efb-bbb0-5850-91e2-0f349b6bdadb",
    "title": "Kho Gaye Hum Kahan",
    "artist": "Jasleen Royal, Prateek Kuhad",
    "language": "Hindi",
    "genre": "Acoustic Indie",
    "moods": [
      "Relaxed",
      "Romantic",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Kho+Gaye+Hum+Kahan+Jasleen+Royal"
  },
  {
    "id": "d8d92c60-cae8-5bce-be95-1c87c1c7292b",
    "title": "Kasoor",
    "artist": "Prateek Kuhad",
    "language": "Hindi",
    "genre": "Acoustic Indie",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Kasoor+Prateek+Kuhad"
  },
  {
    "id": "d1aceed7-5ab0-56d7-a3c7-af90b8afa4d2",
    "title": "Aarambh Hai Prachand",
    "artist": "Piyush Mishra",
    "language": "Hindi",
    "genre": "Epic / Folk Rock",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Aarambh+Hai+Prachand+Piyush+Mishra"
  },
  {
    "id": "9c0bcdb5-b84f-55a6-85a6-e33147548e91",
    "title": "Besabriyaan",
    "artist": "Armaan Malik",
    "language": "Hindi",
    "genre": "Inspirational",
    "moods": [
      "Motivated",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Besabriyaan+Armaan+Malik"
  },
  {
    "id": "1452ef4d-995a-57fc-8042-d7150b548a25",
    "title": "Bekhayali",
    "artist": "Sachet Tandon",
    "language": "Hindi",
    "genre": "Rock / Heartbreak",
    "moods": [
      "Angry",
      "Sad",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=VOLKJJvfAbg"
  },
  {
    "id": "5d1098fc-31ec-5448-8025-ecb6e8beafa0",
    "title": "Tujhe Kitna Chahne Lage",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Sad"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Tujhe+Kitna+Chahne+Lage+Arijit+Singh"
  },
  {
    "id": "fe491fdb-c112-50de-8aea-50d2332e4ff0",
    "title": "Raataan Lambiyan",
    "artist": "Jubin Nautiyal, Asees Kaur",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=gvyUuxdRdR4"
  },
  {
    "id": "a4799b52-adfb-51d8-bea3-1ea36479e825",
    "title": "Kesariya",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=BddP6PYo2gs"
  },
  {
    "id": "1b8c2af2-cd7c-51cc-9bb1-812aa27e8ce2",
    "title": "Ghar",
    "artist": "Mohit Chauhan, Nikhita Gandhi",
    "language": "Hindi",
    "genre": "Lo-Fi / Indie",
    "moods": [
      "Relaxed",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Ghar+Mohit+Chauhan"
  },
  {
    "id": "18b1ddc6-a73b-5968-8e14-9e42c7042bf5",
    "title": "Safarnama",
    "artist": "Lucky Ali",
    "language": "Hindi",
    "genre": "Indie Pop",
    "moods": [
      "Relaxed",
      "Happy",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Safarnama+Lucky+Ali"
  },
  {
    "id": "c469fd41-584c-5f11-89e6-3c0f509ddfe6",
    "title": "O Sanam",
    "artist": "Lucky Ali",
    "language": "Hindi",
    "genre": "Nostalgic Pop",
    "moods": [
      "Nostalgic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=O+Sanam+Lucky+Ali"
  },
  {
    "id": "2fb348f1-6e8d-5d57-b413-049f2cff008f",
    "title": "Kyun Faya Kun (Instrumental Lo-Fi)",
    "artist": "BollyChill",
    "language": "Hindi",
    "genre": "Lo-Fi",
    "moods": [
      "Relaxed",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Kyun+Faya+Kun+(Instrumental+Lo-Fi)+BollyChill"
  },
  {
    "id": "9b907a48-ddec-52fc-b9b1-4920ca4abb85",
    "title": "Dangal",
    "artist": "Daler Mehndi",
    "language": "Hindi",
    "genre": "Motivational",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Dangal+Daler+Mehndi"
  },
  {
    "id": "5964255c-bd76-5fbb-a380-94279f88be01",
    "title": "Kar Har Maidaan Fateh",
    "artist": "Sukhwinder Singh, Shreya Ghoshal",
    "language": "Hindi",
    "genre": "Motivational",
    "moods": [
      "Motivated",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Kar+Har+Maidaan+Fateh+Sukhwinder+Singh"
  },
  {
    "id": "2bb4d0a4-29f1-5400-bb43-5e8cd88d9bd9",
    "title": "Raanjhanaa",
    "artist": "Jaswinder Singh, Shiraz Uppal",
    "language": "Hindi",
    "genre": "Folk Romantic",
    "moods": [
      "Romantic",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=k09uvR5eUao"
  },
  {
    "id": "d88a9823-70f2-5d0f-a71c-a60b242d398f",
    "title": "Kunwara",
    "artist": "Mika Singh",
    "language": "Hindi",
    "genre": "Dance",
    "moods": [
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Kunwara+Mika+Singh"
  },
  {
    "id": "566b22db-90df-56f1-87f4-b8227028b004",
    "title": "Jiyein Kyun",
    "artist": "Papon",
    "language": "Hindi",
    "genre": "Rock Ballad",
    "moods": [
      "Sad",
      "Stressed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Jiyein+Kyun+Papon"
  },
  {
    "id": "83836e21-0990-5641-b437-b714addf6ee6",
    "title": "Moh Moh Ke Dhaage",
    "artist": "Monali Thakur",
    "language": "Hindi",
    "genre": "Classical Romantic",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Moh+Moh+Ke+Dhaage+Monali+Thakur"
  },
  {
    "id": "959998f6-9c32-51c3-8806-cd9060646152",
    "title": "Kal Ho Naa Ho",
    "artist": "Sonu Nigam",
    "language": "Hindi",
    "genre": "Classic Bollywood",
    "moods": [
      "Nostalgic",
      "Sad",
      "Motivated"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=g0eO74UmRBs"
  },
  {
    "id": "73830ce8-9998-5f8d-9b6c-f2b0a06f1251",
    "title": "Hawayein",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=cYOB941gyXI"
  },
  {
    "id": "87d43a44-e5f1-5539-b543-bcb116dae67d",
    "title": "Gallan Goodiyaan",
    "artist": "Yashita Sharma, Manish Kumar Tipu",
    "language": "Hindi",
    "genre": "Party Dance",
    "moods": [
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=jCEdTq3j-0U"
  },
  {
    "id": "06489a66-e285-5685-8b2d-ee4dc5d9e1db",
    "title": "Aadat",
    "artist": "Atif Aslam",
    "language": "Hindi",
    "genre": "Rock",
    "moods": [
      "Sad",
      "Nostalgic",
      "Angry"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Aadat+Atif+Aslam"
  },
  {
    "id": "2d648939-b39e-5c1b-a7a9-e669ebc37cf9",
    "title": "Woh Lamhe",
    "artist": "Atif Aslam",
    "language": "Hindi",
    "genre": "Nostalgic Rock",
    "moods": [
      "Nostalgic",
      "Sad"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Woh+Lamhe+Atif+Aslam"
  },
  {
    "id": "b8c7e7f5-21b7-5ed9-a696-a834eb23535b",
    "title": "Mitwa",
    "artist": "Shafqat Amanat Ali",
    "language": "Hindi",
    "genre": "Sufi Rock",
    "moods": [
      "Romantic",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Mitwa+Shafqat+Amanat+Ali"
  },
  {
    "id": "bae854f0-2569-5e9c-8d61-62d0bf44dd49",
    "title": "Yeh Fitoor Mera",
    "artist": "Arijit Singh",
    "language": "Hindi",
    "genre": "Soul",
    "moods": [
      "Romantic",
      "Stressed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Yeh+Fitoor+Mera+Arijit+Singh"
  },
  {
    "id": "035aab9b-ecf8-59ff-8e26-9401c52d1c46",
    "title": "Nadaan Parindey",
    "artist": "A.R. Rahman, Mohit Chauhan",
    "language": "Hindi",
    "genre": "Rock",
    "moods": [
      "Sad",
      "Stressed",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Nadaan+Parindey+A.R.+Rahman"
  },
  {
    "id": "6f578e6f-f791-50a1-b5f4-6dd4118011fc",
    "title": "Chak De India",
    "artist": "Sukhwinder Singh",
    "language": "Hindi",
    "genre": "Sports Anthem",
    "moods": [
      "Motivated",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Chak+De+India+Sukhwinder+Singh"
  },
  {
    "id": "6b97c49e-1dd7-579d-bc45-7488dccda36a",
    "title": "Pee Loon",
    "artist": "Mohit Chauhan",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Pee+Loon+Mohit+Chauhan"
  },
  {
    "id": "354e4617-6957-54a6-b287-97825939417a",
    "title": "Bulleya",
    "artist": "Amit Mishra, Shilpa Rao",
    "language": "Hindi",
    "genre": "Sufi Rock",
    "moods": [
      "Angry",
      "Motivated",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Bulleya+Amit+Mishra"
  },
  {
    "id": "6a4c9ea8-8aaf-5195-9bce-7efce2b00464",
    "title": "Baarishein",
    "artist": "Anuv Jain",
    "language": "Hindi",
    "genre": "Acoustic Indie",
    "moods": [
      "Sad",
      "Nostalgic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Baarishein+Anuv+Jain"
  },
  {
    "id": "c5e96086-c1a8-52d2-88ae-a7d88c282ddd",
    "title": "Alag Aasmaan",
    "artist": "Anuv Jain",
    "language": "Hindi",
    "genre": "Acoustic Indie",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Alag+Aasmaan+Anuv+Jain"
  },
  {
    "id": "3d9b1f5d-687b-5694-bbea-30d865f00b69",
    "title": "Gul",
    "artist": "Anuv Jain",
    "language": "Hindi",
    "genre": "Acoustic Indie",
    "moods": [
      "Happy",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Gul+Anuv+Jain"
  },
  {
    "id": "8c9289fe-fd3d-5718-8fd2-4423349caeaa",
    "title": "Waqt Ki Baatein",
    "artist": "Dream Note",
    "language": "Hindi",
    "genre": "Indie Pop",
    "moods": [
      "Nostalgic",
      "Sad",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Waqt+Ki+Baatein+Dream+Note"
  },
  {
    "id": "46230c9d-68cf-5ead-bdbd-1b525989adb9",
    "title": "Choo Lo",
    "artist": "The Local Train",
    "language": "Hindi",
    "genre": "Hindi Rock",
    "moods": [
      "Sad",
      "Nostalgic",
      "Stressed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=sFMRqxCexDk"
  },
  {
    "id": "3aaaa59e-bc66-5620-9811-e85680a3b129",
    "title": "Aaoge Tum Kabhi",
    "artist": "The Local Train",
    "language": "Hindi",
    "genre": "Hindi Rock",
    "moods": [
      "Romantic",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Aaoge+Tum+Kabhi+The+Local+Train"
  },
  {
    "id": "e228d400-8d1d-5f9b-a86e-beefde25c3b7",
    "title": "Dil Mere",
    "artist": "The Local Train",
    "language": "Hindi",
    "genre": "Hindi Rock",
    "moods": [
      "Motivated",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Dil+Mere+The+Local+Train"
  },
  {
    "id": "14d0a596-e701-5e6c-ba6e-e8495725e2bd",
    "title": "Khudi",
    "artist": "The Local Train",
    "language": "Hindi",
    "genre": "Alternative Rock",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Khudi+The+Local+Train"
  },
  {
    "id": "c88d514f-7575-55d6-b62e-b27170e3f99a",
    "title": "Sham",
    "artist": "Amit Trivedi, Nikhil D'Souza",
    "language": "Hindi",
    "genre": "Acoustic Feelgood",
    "moods": [
      "Relaxed",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Sham+Amit+Trivedi"
  },
  {
    "id": "71f49f1d-74fd-5c98-ab39-82edc9026eb1",
    "title": "Wake Up Sid!",
    "artist": "Shankar Mahadevan",
    "language": "Hindi",
    "genre": "Pop Rock",
    "moods": [
      "Motivated",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Wake+Up+Sid!+Shankar+Mahadevan"
  },
  {
    "id": "c5df2c57-f0b7-58ce-ac5f-4684a327535c",
    "title": "Senorita",
    "artist": "Farhan Akhtar, Hrithik Roshan, Abhay Deol",
    "language": "Hindi",
    "genre": "Flamenco Pop",
    "moods": [
      "Happy",
      "Relaxed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Senorita+Farhan+Akhtar"
  },
  {
    "id": "60841b58-62b9-57d0-9403-08032d832e24",
    "title": "Socha Hai",
    "artist": "Farhan Akhtar",
    "language": "Hindi",
    "genre": "Rock",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Socha+Hai+Farhan+Akhtar"
  },
  {
    "id": "4bd515bf-299b-56a2-8c8d-84245e62fb31",
    "title": "Ghar More Pardesiya",
    "artist": "Shreya Ghoshal",
    "language": "Hindi",
    "genre": "Classical",
    "moods": [
      "Happy",
      "Nostalgic"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Ghar+More+Pardesiya+Shreya+Ghoshal"
  },
  {
    "id": "ea6dec2e-9684-53cf-882e-1f65502e5d82",
    "title": "Badtameez Dil",
    "artist": "Benny Dayal",
    "language": "Hindi",
    "genre": "Party Dance",
    "moods": [
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Badtameez+Dil+Benny+Dayal"
  },
  {
    "id": "d59b045e-9bba-5ce4-adff-8ee883c14f71",
    "title": "Subhanallah",
    "artist": "Sreerama Chandra",
    "language": "Hindi",
    "genre": "Romantic",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Subhanallah+Sreerama+Chandra"
  },
  {
    "id": "9baf2784-0b63-5ac9-9d6b-96f3138b63e5",
    "title": "Fix You",
    "artist": "Coldplay",
    "language": "English",
    "genre": "Alternative Rock",
    "moods": [
      "Sad",
      "Relaxed",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=k4V3Mo61fJM"
  },
  {
    "id": "bc9bff27-d436-5c3f-b3b6-a297931f67e1",
    "title": "Don't Stop Me Now",
    "artist": "Queen",
    "language": "English",
    "genre": "Classic Rock",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=HgzGwKwLmgM"
  },
  {
    "id": "af840ba8-e86b-54fe-ac70-d391679fe9e1",
    "title": "Happy",
    "artist": "Pharrell Williams",
    "language": "English",
    "genre": "Pop / Funk",
    "moods": [
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=ZbZSe6N_BXs"
  },
  {
    "id": "413c69f5-8d9f-552d-b4ba-f9e7118fa45b",
    "title": "Someone Like You",
    "artist": "Adele",
    "language": "English",
    "genre": "Soul Ballad",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=hLQl3WQQoQ0"
  },
  {
    "id": "6a00a15e-2b41-577c-b8e7-e5aea986ec7a",
    "title": "In the End",
    "artist": "Linkin Park",
    "language": "English",
    "genre": "Nu Metal",
    "moods": [
      "Angry",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=eVTXPUF4Oz4"
  },
  {
    "id": "ce2e2449-6504-5595-a9b9-cbbcc96be507",
    "title": "Weightless",
    "artist": "Marconi Union",
    "language": "English",
    "genre": "Ambient / Chillout",
    "moods": [
      "Relaxed",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=UfcAVejslrU"
  },
  {
    "id": "8ea3f490-67fd-56d9-9567-64be95f63b18",
    "title": "Eye of the Tiger",
    "artist": "Survivor",
    "language": "English",
    "genre": "Hard Rock",
    "moods": [
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=btPJPFnesV4"
  },
  {
    "id": "822e33eb-6cd4-5c88-a4fa-1355ee5ae7b9",
    "title": "Perfect",
    "artist": "Ed Sheeran",
    "language": "English",
    "genre": "Pop Ballad",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=2Vv-BfVoq4g"
  },
  {
    "id": "f8d10de5-ebfd-519e-8817-8f6f9b24e7c2",
    "title": "Thinking Out Loud",
    "artist": "Ed Sheeran",
    "language": "English",
    "genre": "Pop / Soul",
    "moods": [
      "Romantic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=lp-EO5I60KA"
  },
  {
    "id": "f219128a-6f0e-5a22-82c8-4f1e109d82a7",
    "title": "Yellow",
    "artist": "Coldplay",
    "language": "English",
    "genre": "Alternative",
    "moods": [
      "Romantic",
      "Nostalgic",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=yKNxeF4KMsY"
  },
  {
    "id": "994a39ed-d4d4-57ac-b8a8-4cedf3775811",
    "title": "Lose Yourself",
    "artist": "Eminem",
    "language": "English",
    "genre": "Hip Hop",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=_Yhyp-_hX2s"
  },
  {
    "id": "d0815ec5-6084-570e-aa0d-00ecc3805141",
    "title": "All of Me",
    "artist": "John Legend",
    "language": "English",
    "genre": "R&B / Soul",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=450p7goxZqg"
  },
  {
    "id": "ab4bd775-75cb-5dcf-9608-1d54e8eba39d",
    "title": "Counting Stars",
    "artist": "OneRepublic",
    "language": "English",
    "genre": "Pop Rock",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=hT_nvWreIhg"
  },
  {
    "id": "a20000c1-c8dd-5cda-b041-3fdd8432b275",
    "title": "The Scientist",
    "artist": "Coldplay",
    "language": "English",
    "genre": "Piano Rock",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=RB-RcX5DS5A"
  },
  {
    "id": "0264e4f7-d5fb-5aa4-a191-0786fb61cb36",
    "title": "Believer",
    "artist": "Imagine Dragons",
    "language": "English",
    "genre": "Pop Rock",
    "moods": [
      "Motivated",
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=7wtfhZwyrcc"
  },
  {
    "id": "bab574f2-7807-5d7a-9ade-903a85d0c2b7",
    "title": "Radioactive",
    "artist": "Imagine Dragons",
    "language": "English",
    "genre": "Electronic Rock",
    "moods": [
      "Angry",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=ktvTqknDobU"
  },
  {
    "id": "e8e7e5b9-7f17-5b23-80db-1242d3a90db3",
    "title": "Sunflower",
    "artist": "Post Malone, Swae Lee",
    "language": "English",
    "genre": "Pop / R&B",
    "moods": [
      "Happy",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=ApXoWvfEYVU"
  },
  {
    "id": "b480a88f-dc13-5722-91b0-5d36cd4273fa",
    "title": "Stay With Me",
    "artist": "Sam Smith",
    "language": "English",
    "genre": "Soul",
    "moods": [
      "Sad",
      "Romantic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=pB-5XG-DbAA"
  },
  {
    "id": "e5244264-f0ad-5fea-9f4d-cea1fead0eee",
    "title": "Stronger",
    "artist": "Kanye West",
    "language": "English",
    "genre": "Hip Hop",
    "moods": [
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=PsO6ZnUZI0g"
  },
  {
    "id": "94dd09e0-0efd-5810-bb9a-daed97ad475b",
    "title": "Killing in the Name",
    "artist": "Rage Against the Machine",
    "language": "English",
    "genre": "Alternative Metal",
    "moods": [
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=bWXazVhlyxQ"
  },
  {
    "id": "68999a37-ce11-5c1b-aa07-ad25d711e519",
    "title": "Break Stuff",
    "artist": "Limp Bizkit",
    "language": "English",
    "genre": "Nu Metal",
    "moods": [
      "Angry",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=ZpUYjpKg9KY"
  },
  {
    "id": "4c72ec1c-0a33-56e7-82a2-9857d63c959d",
    "title": "Chasing Cars",
    "artist": "Snow Patrol",
    "language": "English",
    "genre": "Indie Rock",
    "moods": [
      "Romantic",
      "Nostalgic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=GemKqzILV4w"
  },
  {
    "id": "1c039576-c3e1-5946-a0da-50462f2461e1",
    "title": "Photograph",
    "artist": "Ed Sheeran",
    "language": "English",
    "genre": "Acoustic Pop",
    "moods": [
      "Nostalgic",
      "Romantic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=nSDgHBxUbVQ"
  },
  {
    "id": "47e35e43-fd8d-5184-bb01-9dfaabd4698f",
    "title": "Viva La Vida",
    "artist": "Coldplay",
    "language": "English",
    "genre": "Baroque Pop",
    "moods": [
      "Nostalgic",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=dvgZkm1xWPE"
  },
  {
    "id": "5faa1d10-692c-53d1-900c-eb26f1bdae51",
    "title": "Can't Stop the Feeling!",
    "artist": "Justin Timberlake",
    "language": "English",
    "genre": "Dance Pop",
    "moods": [
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=ru0K8uYEZWw"
  },
  {
    "id": "7b6a182c-887c-561b-9e81-4a2d48a020fa",
    "title": "Uptown Funk",
    "artist": "Mark Ronson ft. Bruno Mars",
    "language": "English",
    "genre": "Funk Pop",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=OPf0YbXqDm0"
  },
  {
    "id": "e888bc09-f649-5cbf-80f4-d69c7011ae06",
    "title": "Clair de Lune",
    "artist": "Claude Debussy",
    "language": "English",
    "genre": "Classical",
    "moods": [
      "Relaxed",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=WNcsUNKlAKw"
  },
  {
    "id": "10627275-1958-563c-9f01-ac5eb2cf2622",
    "title": "Banana Pancakes",
    "artist": "Jack Johnson",
    "language": "English",
    "genre": "Acoustic Folk",
    "moods": [
      "Relaxed",
      "Happy"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Banana+Pancakes+Jack+Johnson"
  },
  {
    "id": "d55d5949-d0d8-5763-a5e5-93d8f949cb32",
    "title": "Breathe Me",
    "artist": "Sia",
    "language": "English",
    "genre": "Downtempo",
    "moods": [
      "Sad",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Breathe+Me+Sia"
  },
  {
    "id": "37519741-301a-5ea9-9205-55664b4aec78",
    "title": "Unstoppable",
    "artist": "Sia",
    "language": "English",
    "genre": "Electropop",
    "moods": [
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Unstoppable+Sia"
  },
  {
    "id": "7cc1227a-9b22-5aec-b4a5-cc60a5105197",
    "title": "Hall of Fame",
    "artist": "The Script ft. will.i.am",
    "language": "English",
    "genre": "Pop Rock",
    "moods": [
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=mk48xRzuNvA"
  },
  {
    "id": "3ca042b9-0974-5bd6-a45e-0b538fb108d8",
    "title": "Shallow",
    "artist": "Lady Gaga, Bradley Cooper",
    "language": "English",
    "genre": "Country Rock",
    "moods": [
      "Romantic",
      "Motivated"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=bo_efYhYU2A"
  },
  {
    "id": "d4caa549-bfbf-5864-925d-dfe09d29c100",
    "title": "Just the Way You Are",
    "artist": "Bruno Mars",
    "language": "English",
    "genre": "Pop",
    "moods": [
      "Romantic",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=LjhCEhWiKXk"
  },
  {
    "id": "c02e0169-7b6d-5267-9dde-1efc99d0deb1",
    "title": "Demons",
    "artist": "Imagine Dragons",
    "language": "English",
    "genre": "Alternative",
    "moods": [
      "Sad",
      "Stressed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=mWRsgZuwf_8"
  },
  {
    "id": "ac17e912-1f98-59c1-b343-ee829e5e2df1",
    "title": "Boulevard of Broken Dreams",
    "artist": "Green Day",
    "language": "English",
    "genre": "Alternative Rock",
    "moods": [
      "Sad",
      "Angry",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=Soa3gO7tL-c"
  },
  {
    "id": "1038d81e-3867-5f2c-9edb-37c411e35336",
    "title": "Wake Me Up When September Ends",
    "artist": "Green Day",
    "language": "English",
    "genre": "Rock",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=NU9JoFKlaZ0"
  },
  {
    "id": "6e3c9f44-52f6-5e81-9dca-722a1094553f",
    "title": "Summer of '69",
    "artist": "Bryan Adams",
    "language": "English",
    "genre": "Classic Rock",
    "moods": [
      "Nostalgic",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Summer+of+'69+Bryan+Adams"
  },
  {
    "id": "c2ea5dd9-c159-5a86-8540-ee919aaecf83",
    "title": "Sweet Child O' Mine",
    "artist": "Guns N' Roses",
    "language": "English",
    "genre": "Hard Rock",
    "moods": [
      "Nostalgic",
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=1w7OgIMMRc4"
  },
  {
    "id": "905c6261-3211-5478-a83a-584896b1d6e4",
    "title": "Better Together",
    "artist": "Jack Johnson",
    "language": "English",
    "genre": "Acoustic Pop",
    "moods": [
      "Relaxed",
      "Romantic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Better+Together+Jack+Johnson"
  },
  {
    "id": "1b19f420-d54a-5a5d-809f-465fa9c76f80",
    "title": "Put Your Records On",
    "artist": "Corinne Bailey Rae",
    "language": "English",
    "genre": "R&B / Soul",
    "moods": [
      "Relaxed",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=Put+Your+Records+On+Corinne+Bailey+Rae"
  },
  {
    "id": "bb0c27d3-48fd-5235-81b6-3a065d621e6b",
    "title": "Good as Hell",
    "artist": "Lizzo",
    "language": "English",
    "genre": "Funk / Pop",
    "moods": [
      "Happy",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Good+as+Hell+Lizzo"
  },
  {
    "id": "06f593a1-ffb0-53bf-aa56-2c02dd5e7daf",
    "title": "Roar",
    "artist": "Katy Perry",
    "language": "English",
    "genre": "Pop",
    "moods": [
      "Motivated",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=CevxZvSJLk8"
  },
  {
    "id": "aa70ab99-192d-5721-9ba5-1540410abacf",
    "title": "Firework",
    "artist": "Katy Perry",
    "language": "English",
    "genre": "Pop",
    "moods": [
      "Motivated",
      "Happy"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=QGJuMBdaqIw"
  },
  {
    "id": "08259fde-c704-56aa-9351-591ebfef621d",
    "title": "Let Her Go",
    "artist": "Passenger",
    "language": "English",
    "genre": "Folk Rock",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=RBumgq5yVrA"
  },
  {
    "id": "a76f1065-cd6a-5e0d-8759-4eb71a5b3659",
    "title": "When I Was Your Man",
    "artist": "Bruno Mars",
    "language": "English",
    "genre": "Soul Ballad",
    "moods": [
      "Sad",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=When+I+Was+Your+Man+Bruno+Mars"
  },
  {
    "id": "30e767e0-48b9-5d09-b982-0b7d2950195e",
    "title": "Heather",
    "artist": "Conan Gray",
    "language": "English",
    "genre": "Bedroom Pop",
    "moods": [
      "Sad",
      "Stressed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=24u3NoPvgMw"
  },
  {
    "id": "5950fc4b-bc61-5531-97ce-3cef9c2549e2",
    "title": "drivers license",
    "artist": "Olivia Rodrigo",
    "language": "English",
    "genre": "Pop",
    "moods": [
      "Sad",
      "Angry"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/results?search_query=drivers+license+Olivia+Rodrigo"
  },
  {
    "id": "351baffc-470e-5866-8ee9-6e4696a86064",
    "title": "good 4 u",
    "artist": "Olivia Rodrigo",
    "language": "English",
    "genre": "Pop Punk",
    "moods": [
      "Angry",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=gNi_6U5Pm_o"
  },
  {
    "id": "7e9b9df4-9ad7-5c00-9bd9-c98a3426c4a8",
    "title": "Smells Like Teen Spirit",
    "artist": "Nirvana",
    "language": "English",
    "genre": "Grunge",
    "moods": [
      "Angry"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=hTWKbfoikeg"
  },
  {
    "id": "3629e213-086a-53b9-b90a-04ade05fb986",
    "title": "Numb",
    "artist": "Linkin Park",
    "language": "English",
    "genre": "Alternative Rock",
    "moods": [
      "Angry",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=kXYiU_JCYtU"
  },
  {
    "id": "589cc29a-32ab-5843-9131-746160871385",
    "title": "Crawling",
    "artist": "Linkin Park",
    "language": "English",
    "genre": "Alternative Rock",
    "moods": [
      "Angry",
      "Stressed"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Crawling+Linkin+Park"
  },
  {
    "id": "de1a6b20-5081-5068-85e1-53cd32a7c316",
    "title": "Sunday Morning",
    "artist": "Maroon 5",
    "language": "English",
    "genre": "Pop Soul",
    "moods": [
      "Relaxed",
      "Happy"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=S2Cti12XBw4"
  },
  {
    "id": "a9374194-6892-5b65-8b3b-b5b353b62b3a",
    "title": "Beyond",
    "artist": "Leon Bridges",
    "language": "English",
    "genre": "Soul / R&B",
    "moods": [
      "Romantic",
      "Relaxed"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Beyond+Leon+Bridges"
  },
  {
    "id": "1c98ba79-15d3-5df5-8350-a72cae65d0a2",
    "title": "Until I Found You",
    "artist": "Stephen Sanchez",
    "language": "English",
    "genre": "Doo-Wop / Retro Pop",
    "moods": [
      "Romantic",
      "Nostalgic"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=GxldQ9eX2wo"
  },
  {
    "id": "0e935441-6bda-5128-938f-b98b02ee6f12",
    "title": "1979",
    "artist": "The Smashing Pumpkins",
    "language": "English",
    "genre": "Alternative",
    "moods": [
      "Nostalgic",
      "Relaxed"
    ],
    "energy": "medium",
    "url": "https://www.youtube.com/watch?v=4aeETEoNfOg"
  },
  {
    "id": "4097451c-4a22-5a91-b3bc-d10ee08ff24f",
    "title": "Midnight City",
    "artist": "M83",
    "language": "English",
    "genre": "Synthpop",
    "moods": [
      "Nostalgic",
      "Motivated"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/results?search_query=Midnight+City+M83"
  },
  {
    "id": "296d808f-f8ba-5fb1-a776-28f1f2d56975",
    "title": "Holocene",
    "artist": "Bon Iver",
    "language": "English",
    "genre": "Indie Folk",
    "moods": [
      "Relaxed",
      "Sad",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=TWcyIpul8OE"
  },
  {
    "id": "4634cb95-0ac8-50a2-b7e5-8a8cbd4f2e4a",
    "title": "Skinny Love",
    "artist": "Bon Iver",
    "language": "English",
    "genre": "Indie Folk",
    "moods": [
      "Sad",
      "Romantic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/watch?v=ssdgFoHLwnk"
  },
  {
    "id": "e4a833d8-0c55-5b3b-b889-2382bf2eafdf",
    "title": "Chandelier",
    "artist": "Sia",
    "language": "English",
    "genre": "Electropop",
    "moods": [
      "Stressed",
      "Sad"
    ],
    "energy": "high",
    "url": "https://www.youtube.com/watch?v=2vjPBrBU-TM"
  },
  {
    "id": "0232dd0e-d490-5f9b-88e1-05f304f0b6a7",
    "title": "Viva La Vida (Lo-Fi)",
    "artist": "Lofi Fruits",
    "language": "English",
    "genre": "Lo-Fi",
    "moods": [
      "Relaxed",
      "Stressed",
      "Nostalgic"
    ],
    "energy": "low",
    "url": "https://www.youtube.com/results?search_query=Viva+La+Vida+(Lo-Fi)+Lofi+Fruits"
  }
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
    onboarded: false,
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
