import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function MoodAIScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mood AI</Text>
      <Text style={styles.subtitle}>Type how you feel in English, Hindi, or Hinglish.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa' },
});

