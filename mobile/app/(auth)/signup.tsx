import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SignupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>Join Moodify and discover music that matches your vibe.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa' },
});

