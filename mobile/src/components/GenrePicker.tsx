import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface GenrePickerProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

const AVAILABLE_GENRES = [
  'Bollywood',
  'Indie Pop',
  'Rock',
  'Acoustic',
  'Lo-Fi',
  'Pop',
  'Sufi',
  'Hip Hop',
  'R&B',
  'Classical',
  'Dance / EDM',
  'Soul',
];

export default function GenrePicker({
  selectedGenres,
  onChange,
}: GenrePickerProps) {
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre));
    } else {
      if (selectedGenres.length < 5) {
        onChange([...selectedGenres, genre]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Favorite Genres (Pick up to 5)</Text>
      <View style={styles.grid}>
        {AVAILABLE_GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <Pressable
              key={genre}
              onPress={() => toggleGenre(genre)}
              style={[styles.chip, isSelected && styles.selectedChip]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.selectedChipText,
                ]}
              >
                {genre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#404040',
  },
  selectedChip: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  chipText: {
    color: '#D4D4D4',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

