import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../src/context/AuthContext';
import LanguagePicker from '../../src/components/LanguagePicker';
import GenrePicker from '../../src/components/GenrePicker';

export default function ProfileScreen() {
  const { user, profile, savePreferences, signOut, loading } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [preferredLanguages, setPreferredLanguages] = useState<('Hindi' | 'English')[]>(
    profile?.preferredLanguages || ['Hindi', 'English']
  );
  const [genres, setGenres] = useState<string[]>(profile?.genres || []);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPreferredLanguages(profile.preferredLanguages);
      setGenres(profile.genres);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    if (preferredLanguages.length === 0) {
      Alert.alert('Required', 'Please select at least one preferred language.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      await savePreferences({
        name: name.trim(),
        preferredLanguages,
        genres,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      Alert.alert('Success', 'Your preferences have been saved!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Moodify?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings ⚙️</Text>
          <Text style={styles.emailText}>{user?.email || 'Logged in'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#777"
          />

          <LanguagePicker
            selectedLanguages={preferredLanguages}
            onChange={setPreferredLanguages}
          />

          <GenrePicker
            selectedGenres={genres}
            onChange={setGenres}
          />

          <Pressable
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {saveSuccess ? '✓ Saved!' : 'Save Preferences'}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out of Moodify</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#1DB954',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: '#261515',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
