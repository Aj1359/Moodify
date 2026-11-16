import { createClient } from "@supabase/supabase-js";
import { appStorage } from "./storage";

const supabaseUrl = "https://vbyiayxshtavntauzqjl.supabase.co";
const supabaseAnonKey = "paste-the-complete-key-here";

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase anon public key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: appStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
