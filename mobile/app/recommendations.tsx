import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useRecommendations } from "../src/hooks/useRecommendations";
import SongCard from "../src/components/SongCard";
import FeedbackButtons from "../src/components/FeedbackButtons";
import { submitFeedback } from "../src/services/api";
import { FeedbackType, Song } from "../src/types";
import { SupportedMood } from "../src/constants/moods";

export default function RecommendationsScreen() {
  const params = useLocalSearchParams<{ mood?: string }>();
  const mood = params.mood as SupportedMood;

  const { songs, loading, error, removeSong, restoreSong, refresh } =
    useRecommendations(mood);

  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  const handleFeedback = async (song: Song, type: FeedbackType) => {
    setFeedbackLoading(song.id);

    if (type === "dislike") {
      removeSong(song.id);
    }

    try {
      await submitFeedback(song.id, type);

      if (type === "like") {
        Alert.alert("Thank you!", "Song added to your liked feedback.");
      }
    } catch {
      if (type === "dislike") {
        restoreSong(song);
      }

      Alert.alert("Error", "Could not submit feedback. Please try again.");
    } finally {
      setFeedbackLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recommended for You</Text>
        <Text style={styles.subtitle}>
          Songs selected for your {mood} mood.
        </Text>

        {loading && <ActivityIndicator size="large" color="#A78BFA" />}

        {error && (
          <View>
            <Text style={styles.error}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && songs.length === 0 && (
          <Text style={styles.empty}>No songs found for this mood.</Text>
        )}

        {songs.map((song) => (
          <View key={song.id} style={styles.songContainer}>
            <SongCard song={song} />

            <FeedbackButtons
              disabled={feedbackLoading === song.id}
              onFeedback={(type) => handleFeedback(song, type)}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#AAAAAA",
    marginBottom: 24,
  },
  songContainer: {
    marginBottom: 18,
  },
  error: {
    color: "#F87171",
    marginTop: 16,
  },
  empty: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 30,
  },
  retryButton: {
    backgroundColor: "#A78BFA",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  retryText: {
    color: "#121212",
    fontWeight: "bold",
  },
});
