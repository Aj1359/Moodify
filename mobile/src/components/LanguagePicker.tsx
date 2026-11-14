import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

interface LanguagePickerProps {
  selectedLanguages: ('Hindi' | 'English')[];
  onChange: (languages: ('Hindi' | 'English')[]) => void;
}

const LANGUAGES: { id: 'Hindi' | 'English'; prefix: string; label: string }[] = [
  { id: 'Hindi', prefix: 'अ आ', label: 'Hindi' },
  { id: 'English', prefix: '🌐', label: 'English' },
];

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
        {LANGUAGES.map((item) => {
          const isSelected = selectedLanguages.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleLanguage(item.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.prefixText,
                  isSelected && styles.prefixSelected,
                ]}
              >
                {item.prefix}
              </Text>
              <Text
                style={[
                  styles.labelText,
                  isSelected && styles.labelSelected,
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9E94B8',
    marginRight: 6,
  },
  prefixSelected: {
    color: '#4ADE80',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C6BEDC',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkCircle: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#0A0714',
    fontSize: 11,
    fontWeight: '900',
  },
});
