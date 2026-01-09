// router.js
import { supabase } from "./supabase.js";

// ------------------------------------------------------------
// AUTH CHECK
// ------------------------------------------------------------
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// ------------------------------------------------------------
// ROUTE DEFINITIONS
// ------------------------------------------------------------
const routeTable = [
  // Public routes
  { pattern: /^#\/?$/, page: "pages/landing.html", script: null, auth: false },
  { pattern: /^#\/login$/, page: "pages/login.html", script: "login.js", auth: false },
  { pattern: /^#\/signup$/, page: "pages/signup.html", script: null, auth: false },
  { pattern: /^#\/search$/, page: "pages/search.html", script: null, auth: false },
  { pattern: /^#\/security$/, page: "pages/security.html", script: null, auth: false },

  // Protected dynamic routes
  {
    pattern: /^#\/profile\/([0-9a-fA-F-]{36})$/,
    page: "pages/profile.html",
    script: ["profile_main.js", "profile_accordion.js", "profile_height.js", "profile_photos.js"],
    auth: true
  },

  {
    pattern: /^#\/profile-more\/([0-9a-fA-F-]{36})$/,
    page: "pages/profile-more.html",
    script: "profile-more.js",
    auth: true
  },

  {
    pattern: /^#\/profilevw\/(.+)$/,
    page: "pages/profile-view.html",
    script: "profile-view.js",
    auth: true
  },

  // Protected static routes
  { pattern: /^#\/matchmaker$/, page: "pages/matchmaker.html", script: "matchmaker.js", auth: true },
  { pattern: /^#\/admin$/, page: "pages/admin.html", script: "admin.js", auth: true },

  // Create mode (no profileId)
  {
    pattern: /^#\/profile$/,
    page: "pages/profile.html",
    script: ["profile_main.js", "profile_accordion.js", "profile_height.js", "profile_photos.js"],
    auth: true,
    isCreate: true
  },

  // Multi-profile list
  {
    pattern: /^#\/my-profiles$/,
    page: "pages/my-profiles.html",
    script: "my-profiles.js",
    auth: true
  },

  { pattern: /^#\/menu$/, page: "pages/menu.html", script: null, auth: true },
  { pattern: /^#\/menu-manage$/, page: "pages/menu-manage.html", script: null, auth: true },
];

// ------------------------------------------------------------
// MAIN ROUTER WITH CANCEL TOKEN
// ------------------------------------------------------------
let loadToken = 0;

async function loadPage() {
  const token = ++loadToken;

  const hash = window.location.hash || "#/";
  console.log("HASH:", hash);

  let matchedRoute = null;
  let params = [];

  // Match route
  for (const route of routeTable) {
    const match = hash.match(route.pattern);
    if (match) {
      matchedRoute = route;
      params = match.slice(1);
      break;
    }
  }

  // Fallback to landing
  if (!matchedRoute) {
    matchedRoute = routeTable[0];
  }

  console.log("Matched route:", matchedRoute);

  // AUTH CHECK
  if (matchedRoute.auth) {
    const ok = await requireAuth();
    if (!ok) {
      window.location.href = "login.html";
      return;
    }
  }

  // Load HTML
  const html = await fetch(matchedRoute.page).then(res => res.text());

  // Cancel if a newer navigation started
  if (token !== loadToken) return;

  const app = document.getElementById("app");
  app.innerHTML = html;

  // Load page-specific JS
  if (matchedRoute.script) {
    const scripts = Array.isArray(matchedRoute.script)
      ? matchedRoute.script
      : [matchedRoute.script];

    for (const s of scripts) {
      const module = await import(`./${s}`);

      // Cancel if a newer navigation started
      if (token !== loadToken) return;

      // Only call profile_init from profile_main.js
      // Call profile_init() if the module exports it
      if (typeof module.profile_init === "function") {
        if (matchedRoute.isCreate) {
          module.profile_init(null);
        } else {
          module.profile_init(...params);
        }
      }
    }
  }
}

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------
window.addEventListener("hashchange", loadPage);
window.addEventListener("load", loadPage);
