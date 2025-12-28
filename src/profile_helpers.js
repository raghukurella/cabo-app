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