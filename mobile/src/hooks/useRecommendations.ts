import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "../services/api";
import { Song } from "../types";
import { SupportedMood } from "../constants/moods";

export type LanguageFilter = "Hindi" | "English" | "Both";

interface RecommendationsResponse {
  songs: Song[];
  source: string;
}

export function useRecommendations(mood: SupportedMood) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageFilter>("Both");

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        mood,
        language,
        limit: "10",
      });

      const result = await apiRequest<RecommendationsResponse>(
        `/recommendations?${params.toString()}`,
      );

      setSongs(result.songs);
      setSource(result.source);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load recommendations.",
      );
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [mood, language]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const removeSong = (songId: string) => {
    setSongs((current) => current.filter((song) => song.id !== songId));
  };

  const restoreSong = (song: Song) => {
    setSongs((current) => {
      if (current.some((item) => item.id === song.id)) return current;
      return [...current, song];
    });
  };

  return {
    songs,
    source,
    loading,
    error,
    language,
    setLanguage,
    removeSong,
    restoreSong,
    refresh: fetchRecommendations,
  };
}
