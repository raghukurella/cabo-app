import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Read credentials from globals set by credentials.js (loaded as a plain script).
// This keeps `credentials.js` usable by non-module pages (people.html) while
// allowing module consumers (main.js -> config.js) to read the same values.
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
