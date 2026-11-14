import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { getMoodHistory, deleteMoodEntry } from '../../src/services/api';
import { MoodEntry, WeeklyCounts } from '../../src/types';
import { SUPPORTED_MOODS } from '../../src/constants/moods';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [weeklyCounts, setWeeklyCounts] = useState<WeeklyCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getMoodHistory(50);
      setEntries(data.entries || []);
      // Weekly counts strictly come from server - never recounted client-side
      setWeeklyCounts(data.weeklyCounts || null);
    } catch (err: any) {
      console.warn('Error loading mood history:', err);
      Alert.alert('Error', err.message || 'Could not load mood history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleDeleteSingle = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to remove this mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteMoodEntry(id);
              await fetchHistory();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete mood entry.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Mood History',
      'Are you sure you want to permanently delete all your mood logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteMoodEntry('all');
              await fetchHistory();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to clear all entries.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Mood 📊</Text>
            <Text style={styles.subtitle}>
              Weekly mood analytics & your private history.
            </Text>
          </View>
          {entries.length > 0 && (
            <Pressable style={styles.clearAllBtn} onPress={handleDeleteAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <>
            {/* Weekly Overview Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past 7 Days Breakdown</Text>
              <View style={styles.countsGrid}>
                {SUPPORTED_MOODS.map((m) => {
                  const count = weeklyCounts ? weeklyCounts[m.name] || 0 : 0;
                  return (
                    <View key={m.name} style={styles.countCard}>
                      <Text style={styles.countEmoji}>{m.emoji}</Text>
                      <Text style={styles.countNumber}>{count}</Text>
                      <Text style={styles.countLabel}>{m.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Entry Log List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                History Log ({entries.length})
              </Text>

              {entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No mood history found.</Text>
                  <Text style={styles.emptySubtext}>
                    Your submitted moods will appear here so you can track your emotional patterns.
                  </Text>
                </View>
              ) : (
                entries.map((entry) => {
                  const meta = SUPPORTED_MOODS.find(
                    (m) => m.name === entry.confirmedMood
                  );
                  const isDeleting = deletingId === entry.id;
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
                        <View style={styles.moodPill}>
                          <Text style={styles.entryEmoji}>
                            {meta?.emoji || '🎵'}
                          </Text>
                          <Text style={styles.entryMoodText}>
                            {entry.confirmedMood}
                          </Text>
                        </View>
                        <Text style={styles.entryDate}>{dateStr}</Text>
                      </View>

                      <Text style={styles.entryInput} numberOfLines={3}>
                        "{entry.inputText}"
                      </Text>

                      <View style={styles.entryBottom}>
                        {entry.emotion ? (
                          <Text style={styles.entryMeta}>
                            Emotion: {entry.emotion} • Energy: {entry.energy}
                          </Text>
                        ) : <View />}

                        <Pressable
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteSingle(entry.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <Text style={styles.deleteBtnText}>Delete</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    maxWidth: 240,
  },
  clearAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2A1717',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  clearAllText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countCard: {
    width: '23%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  countEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  countLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  entryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  entryMoodText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  entryDate: {
    color: '#777777',
    fontSize: 12,
  },
  entryInput: {
    color: '#E0E0E0',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#282828',
    paddingTop: 8,
  },
  entryMeta: {
    color: '#777777',
    fontSize: 12,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#181818',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
