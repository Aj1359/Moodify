
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { SUPPORTED_MOODS, SupportedMood } from '../constants/moods';

interface MoodChipProps {
  mood: SupportedMood;
  selected: boolean;
  onPress: (mood: SupportedMood) => void;
}

export default function MoodChip({
  mood,
  selected,
  onPress,
}: MoodChipProps) {
  const moodInfo = SUPPORTED_MOODS.find((item) => item.name === mood);

  if (!moodInfo) return null;

  return (
    <Pressable
      onPress={() => onPress(mood)}
      style={[
        styles.chip,
        { borderColor: moodInfo.color },
        selected && { backgroundColor: moodInfo.color },
      ]}
    >
      <Text style={styles.emoji}>{moodInfo.emoji}</Text>
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {moodInfo.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 5,
    backgroundColor: '#1E1E1E',
  },
  emoji: {
    fontSize: 17,
    marginRight: 7,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#121212',
    fontWeight: 'bold',
  },
});
