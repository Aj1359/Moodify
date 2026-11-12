import { supabase } from "./supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
  if (!API_BASE_URL) {
    throw new ApiError("API base URL is not configured", "CONFIG_ERROR");
  }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
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

    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}
