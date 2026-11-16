import { createClient } from "@supabase/supabase-js";
import { appStorage } from "./storage";

// Expo bakes EXPO_PUBLIC_* values into the build only when they are read as
// process.env.EXPO_PUBLIC_NAME. Indirect reads (env["..."]) are empty on a phone.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: appStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
