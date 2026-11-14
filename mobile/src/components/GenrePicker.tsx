import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

interface GenrePickerProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

interface GenreItem {
  id: string;
  label: string;
  icon: string;
}

const AVAILABLE_GENRES: GenreItem[] = [
  { id: 'Bollywood', label: 'Bollywood', icon: '🎬' },
  { id: 'Indie Pop', label: 'Indie Pop', icon: '🎶' },
  { id: 'Rock', label: 'Rock', icon: '🎸' },
  { id: 'Acoustic', label: 'Acoustic', icon: '🎻' },
  { id: 'Lo-Fi', label: 'Lo-Fi', icon: '🎧' },
  { id: 'Pop', label: 'Pop', icon: '🎵' },
  { id: 'Sufi', label: 'Sufi', icon: '🪕' },
  { id: 'Hip Hop', label: 'Hip Hop', icon: '🎤' },
  { id: 'R&B', label: 'R&B', icon: '📊' },
  { id: 'Classical', label: 'Classical', icon: '🎼' },
  { id: 'Dance / EDM', label: 'Dance / EDM', icon: '〰️' },
  { id: 'Soul', label: 'Soul', icon: '🤍' },
];

export default function GenrePicker({
  selectedGenres,
  onChange,
}: GenrePickerProps) {
  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      onChange(selectedGenres.filter((g) => g !== genreId));
    } else {
      if (selectedGenres.length < 5) {
        onChange([...selectedGenres, genreId]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Favorite Genres (Pick up to 5)</Text>
      <View style={styles.grid}>
        {AVAILABLE_GENRES.map((item) => {
          const isSelected = selectedGenres.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleGenre(item.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {item.label}
              </Text>
              {isSelected && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4CEE8',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.15s ease',
    } as any),
  },
  chipUnselected: {
    backgroundColor: '#16132A',
    borderColor: '#2B2648',
  },
  chipSelected: {
    backgroundColor: '#0C341F',
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  chipText: {
    color: '#C6BEDC',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkCircle: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#0A0714',
    fontSize: 10,
    fontWeight: '900',
  },
});
