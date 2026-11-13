const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials missing from environment. Database and Auth calls will fail.');
}

// Service role client: skips RLS for backend operations, but MUST always filter by req.user.id
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Client for auth operations
const supabaseAuth = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || supabaseServiceKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = {
  supabase,
  supabaseAuth,
};

