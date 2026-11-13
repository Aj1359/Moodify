import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { Song } from "../types";

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const openSong = async () => {
    try {
      const supported = await Linking.canOpenURL(song.url);

      if (supported) {
        await Linking.openURL(song.url);
      } else {
        Alert.alert("Unable to open song", "This link is not supported.");
      }
    } catch {
      Alert.alert("Error", "Could not open this song.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{song.title}</Text>

      <Text style={styles.artist}>{song.artist}</Text>

      <View style={styles.details}>
        <Text style={styles.tag}>{song.language}</Text>
        <Text style={styles.tag}>{song.genre}</Text>
        <Text style={styles.tag}>Energy: {song.energy}</Text>
      </View>

      {song.reason ? <Text style={styles.reason}>{song.reason}</Text> : null}

      <Pressable style={styles.playButton} onPress={openSong}>
        <Text style={styles.playText}>▶ Play Song</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#333333",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  artist: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 5,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tag: {
    color: "#C4B5FD",
    backgroundColor: "#30264A",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 7,
    marginBottom: 7,
    fontSize: 12,
  },
  reason: {
    color: "#AAAAAA",
    marginTop: 8,
    fontSize: 13,
  },
  playButton: {
    backgroundColor: "#A78BFA",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 14,
  },
  playText: {
    color: "#121212",
    fontWeight: "bold",
  },
});
