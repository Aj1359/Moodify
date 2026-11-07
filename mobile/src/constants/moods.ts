export type SupportedMood =
  | 'Happy'
  | 'Sad'
  | 'Angry'
  | 'Stressed'
  | 'Relaxed'
  | 'Motivated'
  | 'Romantic'
  | 'Nostalgic';

export interface MoodMeta {
  name: SupportedMood;
  emoji: string;
  color: string;
}

export const SUPPORTED_MOODS: MoodMeta[] = [
  { name: 'Happy', emoji: '😊', color: '#FCD34D' },
  { name: 'Sad', emoji: '🌧️', color: '#60A5FA' },
  { name: 'Angry', emoji: '🔥', color: '#F87171' },
  { name: 'Stressed', emoji: '🤯', color: '#FB923C' },
  { name: 'Relaxed', emoji: '🌿', color: '#34D399' },
  { name: 'Motivated', emoji: '⚡', color: '#A78BFA' },
  { name: 'Romantic', emoji: '💖', color: '#F472B6' },
  { name: 'Nostalgic', emoji: '📻', color: '#FBBF24' },
];

