import { supabase } from "./supabase.js";

console.log("🔥 login.js LOADED");

export function init() {
  console.log("login.js init running");

  const btn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMeInput = document.getElementById("rememberMe");

  // Modal Logic
  const openBtn = document.getElementById("openLoginModalBtn");
  const closeBtn = document.getElementById("closeLoginModalBtn");
  const modal = document.getElementById("loginModal");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  }

  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    // ✅ Attempt login
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Track login
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        let ip = null;
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          const json = await res.json();
          ip = json.ip;
        } catch (e) { console.warn("IP fetch failed", e); }

        await window.supabase.schema("cabo").from("mm_login_history").insert({
          user_id: user.id,
          login_name: user.email,
          ip_address: ip,
          user_agent: navigator.userAgent,
          device_info: "Web Client"
        });
      }
    } catch (err) { console.error("Tracking failed", err); }

    // ✅ Redirect to dashboard or profile
    window.location.hash = "#/";
  });
}