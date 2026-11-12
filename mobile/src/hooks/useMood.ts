import { useState } from "react";
import { apiRequest, ApiError } from "../services/api";
import { SupportedMood } from "../constants/moods";
import { MoodAnalysisResult, MoodEntry } from "../types";

export function useMood() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<MoodAnalysisResult | null>(null);
  const [selectedMood, setSelectedMood] = useState<SupportedMood | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeMood = async () => {
    if (!text.trim()) {
      setError("Please describe how you are feeling.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSelectedMood(null);

    try {
      const result = await apiRequest<MoodAnalysisResult>("/mood/analyze", {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
      });

      setAnalysis(result);
      setSelectedMood(result.targetMoods[0] ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to analyze your mood. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmMood = async () => {
    if (!analysis || !selectedMood) {
      setError("Please select a mood first.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest<{ entry: MoodEntry }>("/mood/confirm", {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          confirmedMood: selectedMood,
          analysis,
        }),
      });

      return result.entry;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to confirm your mood. Please try again.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    text,
    setText,
    analysis,
    selectedMood,
    setSelectedMood,
    loading,
    error,
    analyzeMood,
    confirmMood,
  };
}
