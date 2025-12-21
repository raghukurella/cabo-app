import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ Define constants BEFORE using them
const SUPABASE_URL = "https://tshowljfunfshsodwgtf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaG93bGpmdW5mc2hzb2R3Z3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDYzMDksImV4cCI6MjA3ODcyMjMwOX0.-bdEZsKrw1V58fW-P80WYczV1K-z3vBvlTiILiGNcrg";

// ✅ Confirm they exist
//console.log("✅ Supabase URL:", SUPABASE_URL);
//console.log("✅ Supabase Key:", SUPABASE_ANON_KEY);

// ✅ Create the client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Make it globally available
window.supabase = supabase;

// ✅ Optional: quick connectivity test
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("mm_people").select("*").limit(1);
    return { data, error };
  } catch (err) {
    return { error: err };
  }
}







