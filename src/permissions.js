import { supabase } from "./supabase.js";

export async function loadPermissions() {
  const { data, error } = await supabase
    .from("mm_permissions_for_user")
    .select("permission_name");

  if (error) {
    console.error("Failed to load permissions", error);
    return [];
  }

  return data.map((p) => p.permission_name);
}