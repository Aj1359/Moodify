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

export interface MoodAnalysisResult {
  emotion: string;
  energy: 'low' | 'medium' | 'high';
  intensity: 'low' | 'medium' | 'high';
  context: string;
  targetMoods: SupportedMood[];
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

