import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getMoodHistory } from '../../src/services/api';
import { MoodEntry } from '../../src/types';
import { SUPPORTED_MOODS, SupportedMood } from '../../src/constants/moods';
import MoodChip from '../../src/components/MoodChip';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecent = useCallback(async () => {
    try {
      const data = await getMoodHistory(3);
      setRecentEntries(data.entries.slice(0, 3));
    } catch (err) {
      console.warn('Could not load recent mood entries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecent();
  };

  const handleChipPress = (mood: SupportedMood) => {
    // Tapping a mood chip opens recommendations directly without saving a mood entry
    router.push({
      pathname: '/recommendations',
      params: { mood },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
          />
        }
      >
        {/* Top Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey {profile?.name || 'there'} 👋
          </Text>
          <Text style={styles.subtext}>
            How is your vibe today? Tap a mood or express how you feel.
          </Text>
        </View>

        {/* Mood AI Hero Banner */}
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push('/(tabs)/mood')}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>AI Mood Detection</Text>
            <Text style={styles.heroTitle}>Express in Your Own Words 💭</Text>
            <Text style={styles.heroDesc}>
              Type how you feel in English, Hindi, or Hinglish to get custom song matches.
            </Text>
          </View>
          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Start Mood AI →</Text>
          </View>
        </Pressable>

        {/* Quick Mood Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Mood Picks</Text>
          <Text style={styles.sectionSubtitle}>
            Jump straight to song recommendations:
          </Text>
          <View style={styles.chipsGrid}>
            {SUPPORTED_MOODS.map((m) => (
              <MoodChip
                key={m.name}
                mood={m.name}
                selected={false}
                onPress={() => handleChipPress(m.name)}
              />
            ))}
          </View>
        </View>

        {/* Recent Mood Entries */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Mood Logs</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />
          ) : recentEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No mood logs yet.</Text>
              <Text style={styles.emptySubtext}>
                Use the Mood AI tab to log how you feel and get custom playlists!
              </Text>
            </View>
          ) : (
            recentEntries.map((entry) => {
              const meta = SUPPORTED_MOODS.find((m) => m.name === entry.confirmedMood);
              const dateStr = entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryTop}>
                    <View style={styles.entryMoodPill}>
                      <Text style={styles.entryEmoji}>{meta?.emoji || '🎵'}</Text>
                      <Text style={styles.entryMoodName}>
                        {entry.confirmedMood}
                      </Text>
                    </View>
                    <Text style={styles.entryDate}>{dateStr}</Text>
                  </View>
                  <Text style={styles.entryQuote} numberOfLines={2}>
                    "{entry.inputText}"
                  </Text>
                </View>
              );
            })
          )}
        </View>
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
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  heroContent: {
    marginBottom: 16,
  },
  heroBadge: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: '#1DB954',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  emptyText: {
    color: '#E5E5E5',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  entryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  entryMoodName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  entryDate: {
    color: '#777777',
    fontSize: 12,
  },
  entryQuote: {
    color: '#CCCCCC',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
