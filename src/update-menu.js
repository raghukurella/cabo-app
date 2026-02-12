import { supabase } from "./supabase.js";

export async function updateMenuAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";

  const updateLink = (id, usernameId) => {
    const link = document.getElementById(id);
    const usernameEl = document.getElementById(usernameId);
    
    if (!link) return;

    if (isLoggedIn) {
      link.textContent = "Log out";
      link.href = "#/logout";
      if (usernameEl) {
        usernameEl.textContent = userEmail;
        usernameEl.classList.remove("hidden");
      }
    } else {
      link.textContent = "Welcome";
      link.href = "#/login";
      if (usernameEl) {
        usernameEl.classList.add("hidden");
      }
    }
  };

  updateLink("desktopAuthLink", "desktopUsername");
  updateLink("mobileAuthLink", "mobileUsername");
}