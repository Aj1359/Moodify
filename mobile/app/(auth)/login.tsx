import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login to Moodify</Text>
      <Text style={styles.subtitle}>Sign in with your email and password.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa' },
});

