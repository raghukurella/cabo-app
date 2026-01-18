import { supabase } from "./supabase.js";

export async function forceLogout() {
  try {
    await supabase.auth.signOut();

    localStorage.clear();
    sessionStorage.clear();

    if (window.indexedDB) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        window.indexedDB.deleteDatabase(db.name);
      }
    }

    window.location.hash = "#/login";
  } catch (err) {
    console.error("Force logout failed:", err);
    window.location.hash = "#/login";
  }
}