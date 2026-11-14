import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LanguagePicker from '../../src/components/LanguagePicker';
import GenrePicker from '../../src/components/GenrePicker';

export default function OnboardingScreen() {
  const router = useRouter();
  const { savePreferences, signOut } = useAuth();

  const [name, setName] = useState('');
  const [preferredLanguages, setPreferredLanguages] = useState<('Hindi' | 'English')[]>(['Hindi', 'English']);
  const [genres, setGenres] = useState<string[]>(['Bollywood', 'Indie Pop', 'Lo-Fi']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (preferredLanguages.length === 0) {
      setErrorMsg('Please select at least one preferred language.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await savePreferences({
        name: name.trim(),
        preferredLanguages,
        genres,
      });
      // The auth gate in _layout.tsx will see the updated profile and route to /(tabs)
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepBadge}>Step 2 of 2</Text>
          <Text style={styles.title}>Tune Your Taste 🎧</Text>
          <Text style={styles.subtitle}>
            Tell us how you like your music so Moodify can tailor recommendations to your vibe.
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Your Name / Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul, Tanya"
            placeholderTextColor="#777"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setErrorMsg(null);
            }}
          />
        </View>

        <LanguagePicker
          selectedLanguages={preferredLanguages}
          onChange={setPreferredLanguages}
        />

        <GenrePicker
          selectedGenres={genres}
          onChange={setGenres}
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Get Started 🚀</Text>
          )}
        </Pressable>

        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out & Use Different Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  stepBadge: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#3F1616',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  field: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#1DB954',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutBtn: {
    alignItems: 'center',
    marginTop: 18,
  },
  signOutText: {
    color: '#888888',
    fontSize: 13,
  },
});
