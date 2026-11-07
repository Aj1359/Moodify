import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function RecommendationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Recommended for You</Text>
      <Text style={styles.subtitle}>Curated songs based on your detected mood.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa' },
});
