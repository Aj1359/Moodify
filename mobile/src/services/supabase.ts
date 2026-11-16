import { createClient } from "@supabase/supabase-js";
import { appStorage } from "./storage";

// Expo bakes EXPO_PUBLIC_* values into the build only when they are read as
// process.env.EXPO_PUBLIC_NAME. Indirect reads (env["..."]) are empty on a phone.
const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const configuredAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = configuredUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = configuredAnonKey || "placeholder";

const missingConfig = [
  !configuredUrl && "EXPO_PUBLIC_SUPABASE_URL",
  !configuredAnonKey && "EXPO_PUBLIC_SUPABASE_ANON_KEY",
].filter(Boolean) as string[];

/**
 * Throws a readable error when the build has no Supabase settings. Without
 * this, sign-in goes to the placeholder URL and fails as "Network request failed".
 */
export function assertSupabaseConfigured(): void {
  if (missingConfig.length > 0) {
    throw new Error(
      `This build of the app is missing ${missingConfig.join(" and ")}. ` +
        "Add it under EAS environment variables (preview) and rebuild.",
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: appStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
