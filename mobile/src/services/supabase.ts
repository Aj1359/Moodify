import { createClient } from "@supabase/supabase-js";
import { appStorage } from "./storage";

const env = process.env as Record<string, string | undefined>;

const supabaseUrl = env["EXPO_PUBLIC_SUPABASE_URL"] || "https://placeholder.supabase.co";
const supabaseAnonKey = env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: appStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
