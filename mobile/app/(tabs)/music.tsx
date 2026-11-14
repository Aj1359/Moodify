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
} from 'react-native';
import { useRouter } from 'expo-router';
import { getLikedSongs } from '../../src/services/api';
import { Song } from '../../src/types';
import SongCard from '../../src/components/SongCard';

export default function MusicScreen() {
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLikedSongs = useCallback(async () => {
    setErrorMsg(null);
    try {
      const data = await getLikedSongs();
      setLikedSongs(data.songs || []);
    } catch (err: any) {
      console.warn('Error fetching liked songs:', err);
      setErrorMsg(err.message || 'Could not load your liked songs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLikedSongs();
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
        <View style={styles.header}>
          <Text style={styles.title}>My Music 🎧</Text>
          <Text style={styles.subtitle}>
            Your collection of liked songs and favorite tracks.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchLikedSongs}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : likedSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💚</Text>
            <Text style={styles.emptyTitle}>No Liked Songs Yet</Text>
            <Text style={styles.emptyText}>
              When you listen to song recommendations and hit the Like button, your favorite songs will appear here.
            </Text>
            <Pressable
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/mood')}
            >
              <Text style={styles.exploreBtnText}>Discover Music with Mood AI</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.countText}>
              {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'} saved
            </Text>
            {likedSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </View>
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
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 14,
    fontWeight: '500',
  },
  list: {
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#3F1616',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
