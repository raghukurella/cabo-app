import { supabase } from "./supabase.js";

export async function init() {
  const tbody = document.getElementById("historyList");
  if (!tbody) return;

  // Fetch last 50 logins
  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_login_history")
    .select("*")
    .order("login_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error loading history</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No login history found.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${new Date(row.login_at).toLocaleString()}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${row.login_name || "Unknown User"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${row.ip_address || "Unknown"}
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">
        <div class="truncate max-w-xs" title="${row.user_agent || ''}">
          ${row.device_info || "Web Client"}
        </div>
      </td>
    </tr>
  `).join("");
}