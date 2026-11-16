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
    // Open the link directly. Linking.canOpenURL() returns false for every
    // https link on Android 11+ unless the manifest declares <queries>, which
    // made each song show "This link is not supported". openURL rejects if
    // nothing can handle the link, so the catch below still covers that case.
    if (!/^https?:\/\//i.test(song.url)) {
      Alert.alert("Unable to open song", "This song has no valid link.");
      return;
    }
    try {
      await Linking.openURL(song.url);
    } catch {
      Alert.alert("Unable to open song", "Could not open this song. Is a browser or YouTube installed?");
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
