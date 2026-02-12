import { supabase } from "./supabase.js";

export async function loadPermissions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .rpc('fn_permissions_for_user', { target_user_id: user.id });

  if (error) {
    console.error("Failed to load permissions", error);
    return [];
  }

  // RPC returns array of strings or objects depending on definition.
  // Assuming it returns table rows: { permission_name: '...' }
  // If it returns a text array, we just return data.
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    return data.map(p => p.permission_name);
  }
  return data || [];
}