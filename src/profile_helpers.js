// profile_helpers.js
export const qs = id => document.getElementById(id);

export function showStatus(msg, autoHideMs = 0) {
  const el = qs("profileStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.remove("hidden");
  if (autoHideMs) setTimeout(() => el.classList.add("hidden"), autoHideMs);
}

export function getProfileIdFromHash() {
  const match = window.location.hash.match(/^#\/profile\/([0-9a-fA-F-]{36})$/);
  return match ? match[1] : null;
}




// -----------------------------
// Profile Sharing Helper
// -----------------------------
export async function createProfileShare(profileId, email, maxViews, daysValid) {
  if (!profileId) throw new Error("Missing profileId");

  const token = crypto.randomUUID();

  const expiresAt = daysValid
    ? new Date(Date.now() + daysValid * 86400000).toISOString()
    : null;

  const { error } = await supabase
    .schema("cabo")
    .from("mm_profile_shares")
    .insert({
      profile_id: profileId,
      shared_with_email: email,
      share_token: token,
      max_views: maxViews || null,
      expires_at: expiresAt
    });

  if (error) {
    console.error("Share creation failed:", error);
    throw error;
  }

  return token;
}
