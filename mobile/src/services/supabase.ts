import { createClient } from "@supabase/supabase-js";
import { appStorage } from "./storage";

const supabaseUrl = "https://vbyiayxshtavntauzqjl.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieWlheXhzaHRhdm50YXV6cWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MjAyMTAsImV4cCI6MjExMDM5NjIxMH0.KtPp9063SO9B8354x0xPA1SyG0yoPGwQik1AIdQPVt0";

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
