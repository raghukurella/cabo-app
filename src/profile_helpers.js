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

// -----------------------------
// Phone Input Helper (intl-tel-input)
// -----------------------------
export async function initPhoneInput(inputEl) {
  if (!inputEl) return null;

  // 1. Load CSS
  if (!document.getElementById("iti-css")) {
    const link = document.createElement("link");
    link.id = "iti-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css";
    document.head.appendChild(link);
  }

  // 2. Load JS
  if (!window.intlTelInput) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // 3. Initialize
  if (inputEl._iti) inputEl._iti.destroy();

  const iti = window.intlTelInput(inputEl, {
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
    preferredCountries: ["us", "in", "gb", "ca"],
    separateDialCode: true,
    autoPlaceholder: "aggressive"
  });

  inputEl._iti = iti;
  return iti;
}
