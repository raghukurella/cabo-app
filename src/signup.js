import { supabase } from "./supabase.js";

export function init() {
  const btn = document.getElementById("signupBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");

  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const name = nameInput.value.trim();

      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }

      const originalText = btn.textContent;
      btn.textContent = "Creating...";
      btn.disabled = true;

      // Create auth user (Supabase sends verification email automatically)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/#/auth/callback`,
          data: {
            full_name: name
          }
        }
      });

      if (error) {
        alert(error.message);
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }

      alert("Check your email to confirm your account.");
      window.location.hash = "#/login";
    });
  }
}