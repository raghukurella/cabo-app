// ------------------------------------------------------------
// router.js
// ------------------------------------------------------------
import { supabase } from "./supabase.js";
import { shared_profile_init } from "./shared-profile.js";

import { loadPermissions } from "./permissions.js";
import { permissionStore } from "./permissionStore.js";
import { hasPermission } from "./hasPermission.js";
import { forceLogout } from "./forceLogout.js";
import { enforcePermissions } from "./enforcePermissions.js";
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
  { pattern: /^#\/login-history$/, page: "pages/login-history.html", script: "login-history.js", auth: true },
  { pattern: /^#\/logout$/, page: null, script: null, auth: false, logout: true },
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
  { pattern: /^#\/questions-manage$/, page: "pages/questions-manage.html", script: "questions-manage.js", auth: true },
  { pattern: /^#\/all-profiles$/, page: "pages/all-profiles.html", script: "all-profiles.js", auth: true },

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

  // ------------------------------------------------------------
  // LOAD PERMISSIONS BEFORE ROUTING
  // ------------------------------------------------------------
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const permissions = await loadPermissions();
    permissionStore.set(permissions);
  }

  // ------------------------------------------------------------
  // SPECIAL CASE: SHARED PROFILE
  // ------------------------------------------------------------
  if (hash.startsWith("#/shared-profile/")) {
    const token = hash.split("/")[2];

    const html = await fetch("pages/shared-profile.html").then(r => r.text());
    document.getElementById("app").innerHTML = html;

    shared_profile_init(token);
    return;
  }

  // ------------------------------------------------------------
  // MATCH ROUTE
  // ------------------------------------------------------------
  let matchedRoute = null;
  let params = [];

  for (const route of routeTable) {
    const match = hash.match(route.pattern);
    if (match) {
      matchedRoute = route;
      params = match.slice(1);
      break;
    }
  }

  if (!matchedRoute) {
    matchedRoute = routeTable[0];
  }


  if (matchedRoute.logout) {
    const { forceLogout } = await import("./forceLogout.js");
    await forceLogout();
    return;
    ``
  }

  // ------------------------------------------------------------
  // AUTH CHECK (must run BEFORE loading HTML)
  // ------------------------------------------------------------
  if (matchedRoute.auth) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn("No valid session → forcing logout");
      await forceLogout();
      return;
    }

    // Optional: token expiration check
    const expiresAt = session.expires_at * 1000;
    if (Date.now() > expiresAt) {
      console.warn("Expired session → forcing logout");
      await forceLogout();
      return;
    }
  }

  // ------------------------------------------------------------
  // PERMISSION GUARDS
  // ------------------------------------------------------------
  if (matchedRoute.page === "pages/admin.html") {
    if (!hasPermission("manage_app")) {
      window.location.hash = "#/unauthorized";
      return;
    }
  }

  // ------------------------------------------------------------
  // LOAD HTML
  // ------------------------------------------------------------
  let loadSuccess = true;
  const html = await fetch(matchedRoute.page + "?t=" + Date.now()).then(res => {
    if (!res.ok) {
      throw new Error(`Failed to load ${matchedRoute.page}: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }).catch(err => {
    loadSuccess = false;
    console.error("Page load failed:", err);
    return `<div class="p-4 text-red-600">Error loading page: ${err.message}</div>`;
  });

  if (token !== loadToken) return;

  const app = document.getElementById("app");
  if (!app) {
    console.error("CRITICAL: #app container not found in index.html");
    return;
  }
  app.innerHTML = html;

  if (!loadSuccess) return;

  enforcePermissions();

  // ------------------------------------------------------------
  // LOAD PAGE-SPECIFIC JS
  // ------------------------------------------------------------
  if (matchedRoute.script) {
    const ts = Date.now();
    if (Array.isArray(matchedRoute.script)) {
      for (const s of matchedRoute.script) {
        const module = await import("./" + s + "?t=" + ts);
        if (token !== loadToken) return;

        // 1. profile_init (your existing pattern)
        if (typeof module.profile_init === "function") {
          if (matchedRoute.isCreate) {
            module.profile_init(null);
          } else {
            module.profile_init(...params);
          }
          continue;
        }

        // 2. page_init (generic initializer)
        if (typeof module.page_init === "function") {
          module.page_init(...params);
          continue;
        }

        // 3. init (universal initializer)
        if (typeof module.init === "function") {
          module.init(...params);
          continue;
        }
      }
    } else {
      const module = await import("./" + matchedRoute.script + "?t=" + ts);
      if (token !== loadToken) return;

      // 1. profile_init (your existing pattern)
      if (typeof module.profile_init === "function") {
        if (matchedRoute.isCreate) {
          module.profile_init(null);
        } else {
          module.profile_init(...params);
        }
        return;
      }

      // 2. page_init (generic initializer)
      if (typeof module.page_init === "function") {
        module.page_init(...params);
        return;
      }

      // 3. init (universal initializer)
      if (typeof module.init === "function") {
        module.init(...params);
        return;
      }
    }
  }
}

// ------------------------------------------------------------
// DEBUG AUTH STATE
// ------------------------------------------------------------
async function debugAuthState() {
  console.clear();

  const { data: { session } } = await supabase.auth.getSession();
  const sessionId = session?.access_token?.slice(0, 12) + "..." || null;

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  let permissions = [];
  if (userId) {
    const { data: perms } = await supabase
      .schema("cabo")
      .from("mm_permissions_for_user")
      .select("permission_name");

    permissions = perms?.map(p => p.permission_name) || [];
  }

  console.log("🔐 AUTH DEBUG");
  console.log("session:", sessionId);
  console.log("user:", userId);
  console.log("permissions:", permissions);
}

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------
window.addEventListener("hashchange", loadPage);
window.addEventListener("load", loadPage);