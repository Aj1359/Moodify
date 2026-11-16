import { supabase } from "./supabase";
import { mockFetch } from "./mocks";
import {
  FeedbackType,
  UserProfile,
  UpdatePreferencesRequest,
  MoodHistoryResponse,
  DeleteMoodResponse,
  Song,
  ConfirmMoodRequest,
  ConfirmMoodResponse,
  MoodAnalysisResult,
} from "../types";

// Expo bakes EXPO_PUBLIC_* values into the build only when they are read as
// process.env.EXPO_PUBLIC_NAME. Indirect reads (env["..."]) are empty on a phone.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message?: string;
    code?: string;
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken: string | undefined;

  if (!USE_MOCKS) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new ApiError(sessionError.message, "AUTH_ERROR");
    }

    if (!session?.access_token) {
      throw new ApiError("Please sign in to continue", "UNAUTHORIZED");
    }

    accessToken = session.access_token;
  }

  if (!USE_MOCKS && !API_BASE_URL) {
    throw new ApiError(
      "This build of the app is missing EXPO_PUBLIC_API_BASE_URL. Add it under EAS environment variables (preview) and rebuild.",
      "CONFIG_ERROR",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const url = `${API_BASE_URL || "http://localhost:5000/api"}${endpoint}`;

  try {
    const response = USE_MOCKS
      ? await mockFetch(url, {
          method: options.method,
          body: typeof options.body === "string" ? options.body : undefined,
        })
      : await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });

    const result = (await response.json()) as ApiResponse<T>;

    if (!response.ok || result.error) {
      throw new ApiError(
        result.error?.message ?? "Something went wrong",
        result.error?.code ?? `HTTP_${response.status}`,
      );
    }

    if (!("data" in result)) {
      throw new ApiError("Invalid API response", "INVALID_RESPONSE");
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", "TIMEOUT");
    }

    // React Native's fetch rejects with TypeError("Network request failed")
    // when the server cannot be reached at all; say which server that was.
    if (error instanceof TypeError) {
      throw new ApiError(
        `Cannot reach the Moodify server at ${url.split("/api")[0]}. Check your internet connection and that the backend is running.`,
        "NETWORK_ERROR",
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitFeedback(songId: string, type: FeedbackType) {
  return apiRequest<{ songId: string; type: FeedbackType }>("/feedback", {
    method: "POST",
    body: JSON.stringify({ songId, type }),
  });
}

export async function getPreferences() {
  return apiRequest<UserProfile>("/preferences");
}

export async function updatePreferences(data: UpdatePreferencesRequest) {
  return apiRequest<UserProfile>("/preferences", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getMoodHistory(limit = 20) {
  return apiRequest<MoodHistoryResponse>(`/mood/history?limit=${limit}`);
}

export async function deleteMoodEntry(id: string) {
  return apiRequest<DeleteMoodResponse>(`/mood/${id}`, {
    method: "DELETE",
  });
}

export async function getLikedSongs() {
  return apiRequest<{ songs: Song[] }>("/feedback/liked");
}

export async function analyzeMood(text: string) {
  return apiRequest<MoodAnalysisResult>("/mood/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function confirmMood(data: ConfirmMoodRequest) {
  return apiRequest<ConfirmMoodResponse>("/mood/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
