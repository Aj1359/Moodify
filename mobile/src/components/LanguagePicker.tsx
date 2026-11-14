import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface LanguagePickerProps {
  selectedLanguages: ('Hindi' | 'English')[];
  onChange: (languages: ('Hindi' | 'English')[]) => void;
}

const LANGUAGES: ('Hindi' | 'English')[] = ['Hindi', 'English'];

export default function LanguagePicker({
  selectedLanguages,
  onChange,
}: LanguagePickerProps) {
  const toggleLanguage = (lang: 'Hindi' | 'English') => {
    if (selectedLanguages.includes(lang)) {
      // Keep at least one selected
      if (selectedLanguages.length > 1) {
        onChange(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      onChange([...selectedLanguages, lang]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preferred Languages</Text>
      <View style={styles.optionsRow}>
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguages.includes(lang);
          return (
            <Pressable
              key={lang}
              onPress={() => toggleLanguage(lang)}
              style={[styles.chip, isSelected && styles.selectedChip]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.selectedChipText,
                ]}
              >
                {lang === 'Hindi' ? '🇮🇳 Hindi' : '🌐 English'}
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
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    fontSize: 14,
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
});

