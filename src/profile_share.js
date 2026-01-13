import { supabase } from "./supabase.js";
import { qs } from "./profile_helpers.js";

export function profile_attachShareButton() {
  console.log("attach running");

  const btn = qs("shareProfileBtn");
  const modal = qs("shareModal");
  const submitBtn = qs("shareSubmitBtn");
  const cancelBtn = qs("shareCancelBtn");

  if (!btn) {
    console.warn("Share button not found");
    return;
  }

  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  submitBtn.addEventListener("click", async () => {
    const email = qs("shareEmail").value;
    const maxViews = Number(qs("shareViews").value);
    const daysValid = Number(qs("shareDays").value);

    const profileId = window.currentProfileId;   // ⭐ FIXED

    const token = await createProfileShare(profileId, email, maxViews, daysValid);

    alert("Share link created:\n" + `${window.location.origin}/#/shared-profile/${token}`);
    modal.classList.add("hidden");
  });
}

export async function createProfileShare(profileId, email, maxViews, daysValid) {
  if (!profileId) throw new Error("No profile selected");   // ⭐ now correct

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







export async function loadSharedProfile(token) {
  // 1. Look up the share record
  const { data: share, error } = await supabase
    .schema("cabo")
    .from("mm_profile_shares")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !share) {
    showShareError("This link is invalid.");
    return;
  }

  // 2. Check expiration (client-side check only — RLS will enforce later)
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    showShareError("This link has expired.");
    return;
  }

  // 3. Check view limit (client-side check only — RLS will enforce later)
  if (share.max_views !== null && share.view_count >= share.max_views) {
    showShareError("This link has reached its maximum number of views.");
    return;
  }

  // 4. Load the profile
  renderSharedProfile(share.profile_id, token);
}


function showShareError(message) {
  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="p-6 text-center text-red-600 text-lg">
      ${message}
    </div>
  `;
}


async function renderSharedProfile(profileId, token) {
  const { data: profile, error } = await supabase
    .schema("cabo")
    .from("mm_people")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profile) {
    showShareError("Profile not found.");
    return;
  }

  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">${profile.full_name}</h1>
      <p>Age: ${profile.age}</p>
      <p>Location: ${profile.city}, ${profile.state}</p>
      <p>Bio: ${profile.bio || "No bio provided."}</p>
    </div>
  `;
}