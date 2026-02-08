import { supabase } from "./supabase.js";

export function init() {
  const btn = document.getElementById("updatePwBtn");
  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");

  if (!btn) return;

  // Check if we have a valid session (Supabase handles the token from URL automatically)
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      alert("Invalid or expired reset link. Please try requesting a new one.");
      window.location.hash = "#/forgot-password";
    }
  });

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!password) {
      alert("Please enter a new password.");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = "Updating...";
    btn.disabled = true;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Error updating password: " + error.message);
      btn.textContent = originalText;
      btn.disabled = false;
    } else {
      alert("Password updated successfully!");
      window.location.hash = "#/";
    }
  });
}