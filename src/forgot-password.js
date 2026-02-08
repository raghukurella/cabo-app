import { supabase } from "./supabase.js";

export function init() {
  const btn = document.getElementById("resetBtn");
  const emailInput = document.getElementById("resetEmail");

  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = "Sending...";
    btn.disabled = true;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/update-password`,
    });

    if (error) {
      alert(error.message);
      btn.textContent = originalText;
      btn.disabled = false;
    } else {
      alert("Check your email for the password reset link.");
      window.location.hash = "#/login";
    }
  });
}