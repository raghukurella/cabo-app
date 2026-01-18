
  import { supabase } from "./supabase.js";
  const btn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");


console.log("🔥 login.js LOADED");

  export function init() {
    console.log("login.js init running");

    const btn = document.getElementById("loginBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      // your login logic here
    });
  }

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

    // ✅ Redirect to dashboard or profile
    window.location.hash = "#/my-profiles";
  });