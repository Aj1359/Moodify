import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { FeedbackType } from "../types";

interface FeedbackButtonsProps {
  onFeedback: (type: FeedbackType) => void;
  disabled?: boolean;
  selectedType?: FeedbackType | null;
}

export default function FeedbackButtons({
  onFeedback,
  disabled = false,
  selectedType = null,
}: FeedbackButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          styles.like,
          selectedType === "like" && styles.selectedLike,
          disabled && styles.disabled,
        ]}
        onPress={() => onFeedback("like")}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {selectedType === "like" ? "♥ Liked" : "♥ Like"}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          styles.skip,
          selectedType === "skip" && styles.selectedSkip,
          disabled && styles.disabled,
        ]}
        onPress={() => onFeedback("skip")}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {selectedType === "skip" ? "Skipped ✓" : "Skip →"}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          styles.dislike,
          selectedType === "dislike" && styles.selectedDislike,
          disabled && styles.disabled,
        ]}
        onPress={() => onFeedback("dislike")}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {selectedType === "dislike" ? "✕ Disliked" : "✕ Dislike"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    marginHorizontal: 3,
  },
  like: {
    backgroundColor: "#22543D",
  },
  skip: {
    backgroundColor: "#383838",
  },
  dislike: {
    backgroundColor: "#7F1D1D",
  },
  selectedLike: {
    backgroundColor: "#16A34A",
  },
  selectedSkip: {
    backgroundColor: "#575757",
  },
  selectedDislike: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabled: {
    opacity: 0.4,
  },
});
