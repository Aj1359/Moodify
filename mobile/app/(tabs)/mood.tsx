import React from "react";
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
} from "react-native";
import { useRouter } from "expo-router";

import { useMood } from "../../src/hooks/useMood";
import MoodChip from "../../src/components/MoodChip";
import { SUPPORTED_MOODS } from "../../src/constants/moods";

export default function MoodAIScreen() {
  const router = useRouter();

  const {
    text,
    setText,
    analysis,
    selectedMood,
    setSelectedMood,
    loading,
    error,
    analyzeMood,
    confirmMood,
  } = useMood();

  const handleConfirm = async () => {
    const entry = await confirmMood();

    if (entry) {
      router.push({
        pathname: "/recommendations",
        params: { mood: entry.confirmedMood },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How are you feeling?</Text>

        <Text style={styles.subtitle}>
          Express your feelings in English, Hindi, or Hinglish.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Tell us what's on your mind..."
          placeholderTextColor="#888"
          multiline
          value={text}
          onChangeText={setText}
          editable={!loading}
        />

        <Pressable
          style={[
            styles.button,
            (!text.trim() || loading) && styles.disabledButton,
          ]}
          onPress={analyzeMood}
          disabled={!text.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.buttonText}>Analyze My Mood</Text>
          )}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        {analysis && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>
              This is how we understand your feelings
            </Text>

            <Text style={styles.emotion}>{analysis.emotion}</Text>

            <Text style={styles.description}>{analysis.context}</Text>

            <Text style={styles.detail}>Energy: {analysis.energy}</Text>

            <Text style={styles.detail}>Intensity: {analysis.intensity}</Text>

            <Text style={styles.selectTitle}>Choose or confirm your mood</Text>

            <View style={styles.moodList}>
              {SUPPORTED_MOODS.map((item) => (
                <MoodChip
                  key={item.name}
                  mood={item.name}
                  selected={selectedMood === item.name}
                  onPress={setSelectedMood}
                />
              ))}
            </View>

            <Pressable
              style={[
                styles.button,
                (!selectedMood || loading) && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!selectedMood || loading}
            >
              {loading ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Text style={styles.buttonText}>Confirm My Mood</Text>
              )}
            </Pressable>
          </View>
        )}
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#A0A0A0",
    marginBottom: 24,
  },
  input: {
    minHeight: 130,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#383838",
  },
  button: {
    backgroundColor: "#A78BFA",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#121212",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "#F87171",
    marginTop: 14,
  },
  resultContainer: {
    marginTop: 28,
  },
  resultTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  emotion: {
    color: "#A78BFA",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    color: "#CCCCCC",
    fontSize: 15,
    marginBottom: 14,
  },
  detail: {
    color: "#A0A0A0",
    fontSize: 14,
    marginBottom: 6,
  },
  selectTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  moodList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
});
