import { createClient } from "@supabase/supabase-js";

const env = process.env as Record<string, string | undefined>;

const supabaseUrl = env["EXPO_PUBLIC_SUPABASE_URL"];
const supabaseAnonKey = env["EXPO_PUBLIC_SUPABASE_ANON_KEY"];
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Check your mobile/.env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
