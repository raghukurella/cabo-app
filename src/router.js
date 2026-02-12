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
import { updateMenuAuth } from "./update-menu.js";
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
export const routeTable = [
  // Public routes
  { pattern: /^#\/?$/, page: "pages/main.html", script: "main.js", auth: false, menuData: { category: "Public Pages", label: "Main Page", description: "Home page with search", path: "#/" } },
  { pattern: /^#\/login\/?$/, page: "pages/login.html", script: "login.js", auth: false, menuData: { category: "Public Pages", label: "Login", description: "User sign in", path: "#/login" } },
  { pattern: /^#\/forgot-password\/?$/, page: "pages/forgot-password.html", script: "forgot-password.js", auth: false, menuData: { category: "Public Pages", label: "Forgot Password", description: "Reset password flow", path: "#/forgot-password" } },
  { pattern: /^#\/update-password/, page: "pages/update-password.html", script: "update-password.js", auth: false, menuData: { category: "Account & Security", label: "Update Password", description: "Change current password", path: "#/update-password" } },
  { pattern: /^#\/signup\/?$/, page: "pages/signup.html", script: "signup.js", auth: false, menuData: { category: "Public Pages", label: "Signup", description: "Create new account", path: "#/signup" } },
  { pattern: /^#\/search\/?$/, page: "pages/search.html", script: null, auth: false, menuData: { category: "Development / Testing", label: "Search Page", description: "Standalone search UI", path: "#/search" } },
  { pattern: /^#\/security\/?$/, page: "pages/security.html", script: null, auth: true, menuData: { category: "Account & Security", label: "Security", description: "Roles and permissions", path: "#/security" } },
  { pattern: /^#\/login-history\/?$/, page: "pages/login-history.html", script: "login-history.js", auth: true, menuData: { category: "Account & Security", label: "Login History", description: "Audit logs", path: "#/login-history" } },
  { pattern: /^#\/logout\/?$/, page: null, script: null, auth: false, logout: true },
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

  {
    pattern: /^#\/details\/(.+)$/,
    page: "pages/details.html",
    script: "details.js",
    auth: true
  },

  // Protected static routes
  { pattern: /^#\/matchmaker\/?$/, page: "pages/matchmaker.html", script: "matchmaker.js", auth: true, permission: "manage_matchmaking", menuData: { category: "Dashboards & Profiles", label: "Matchmaker", description: "Matchmaker dashboard", path: "#/matchmaker" } },
  { pattern: /^#\/admin\/?$/, page: "pages/admin.html", script: "admin.js", auth: true, permission: "manage_app", menuData: { category: "Admin & Management", label: "Admin Dashboard", description: "Manage matchmakers", path: "#/admin" } },
  { pattern: /^#\/questions-manage\/?$/, page: "pages/questions-manage.html", script: "questions-manage.js", auth: true, permission: "manage_app", menuData: { category: "Admin & Management", label: "Manage Questions", description: "Edit profile questions", path: "#/questions-manage" } },
  { pattern: /^#\/all-profiles\/?$/, page: "pages/all-profiles.html", script: "all-profiles.js", auth: true, menuData: { category: "Dashboards & Profiles", label: "All Profiles", description: "Grid view of all profiles", path: "#/all-profiles" } },
  { pattern: /^#\/prospect\/?$/, page: "pages/prospect.html", script: "prospect.js", auth: true, menuData: { category: "Tools & Biodata", label: "Prospect Form", description: "Add prospect manually", path: "#/prospect" } },
  { pattern: /^#\/onboarding(\.html)?\/?$/, page: "pages/onboarding.html", script: "onboarding.js", auth: true, menuData: { category: "Tools & Biodata", label: "Onboarding", description: "User onboarding flow", path: "#/onboarding" } },
  { pattern: /^#\/manage_question_bank(\.html)?\/?$/, page: "pages/manage_question_bank.html", script: "manage_question_bank.js", auth: true, menuData: { category: "Admin & Management", label: "Question Bank", description: "Manage global question bank", path: "#/manage_question_bank" } },
  { pattern: /^#\/upload-biodata\/?$/, page: "pages/upload-biodata.html", script: "upload-biodata.js", auth: false, menuData: { category: "Tools & Biodata", label: "Upload Biodata", description: "File upload utility", path: "#/upload-biodata" } },
  { pattern: /^#\/editable-preview(\?.*)?$/, page: "pages/editable-preview.html", script: "editable-preview.js", auth: true, menuData: { category: "Development / Testing", label: "Editable Preview", description: "Preview component test", path: "#/editable-preview" } },
  { pattern: /^#\/test-pipeline\/?$/, page: "pages/test-pipeline.html", script: "test-biodata-pipeline.js", auth: true, menuData: { category: "Development / Testing", label: "Test Pipeline", description: "Test biodata parsing logic", path: "#/test-pipeline" } },
  { pattern: /^#\/process-biodata\/?$/, page: "pages/process-biodata.html", script: "process-biodata.js", auth: false, menuData: { category: "Tools & Biodata", label: "Process Biodata", description: "Parse raw text to profile", path: "#/process-biodata" } },

  // Create mode (no profileId)
  {
    pattern: /^#\/profile\/?$/,
    page: "pages/profile.html",
    script: ["profile_main.js", "profile_accordion.js", "profile_height.js", "profile_photos.js"],
    auth: true,
    isCreate: true,
    menuData: { category: "Dashboards & Profiles", label: "Create Profile", description: "New profile form", path: "#/profile" }
  },

  // Multi-profile list
  {
    pattern: /^#\/my-profiles\/?$/,
    page: "pages/my-profiles.html",
    script: "my-profiles.js",
    auth: true,
    menuData: { category: "Dashboards & Profiles", label: "My Profiles", description: "List of profiles managed by you", path: "#/my-profiles" }
  },

  { pattern: /^#\/menu\/?$/, page: "pages/menu.html", script: "menu.js", auth: true },
  { pattern: /^#\/menu-manage\/?$/, page: "pages/menu-manage.html", script: null, auth: true, menuData: { category: "Admin & Management", label: "Menu Manage", description: "Alternative management menu", path: "#/menu-manage" } },
  { pattern: /^#\/add-profile\/?$/, page: "pages/add-profile.html", script: "add-profile.js", auth: false, menuData: { category: "Dashboards & Profiles", label: "Add Profile (Form)", description: "Add a new profile via form", path: "#/add-profile" } },
  { pattern: /^#\/menu-manage\/?$/, page: "pages/menu-manage.html", script: null, auth: true, permission: "manage_app", menuData: { category: "Admin & Management", label: "Menu Manage", description: "Alternative management menu", path: "#/menu-manage" } },
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
  } else {
    permissionStore.set([]);
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

  if (matchedRoute.page === "pages/main.html" && !session) {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `
        <div class="max-w-4xl mx-auto px-6 py-12 text-center">
          <p class="text-xl text-gray-700 leading-relaxed mb-6">
            We currently aren’t provisioning a publicly searchable database, as protecting everyone’s privacy and interests is important to us. That said, if you’re curious, there are 43 girls and 28 boys in our database who are eager to be introduced to their future life partners.
          </p>
          <p class="text-xl text-gray-700 leading-relaxed">
            Every single one of them is known to us either personally, or through a trusted friend or relative — and often through their friends or relatives. In other words, there is at most two degrees of separation, which is something I care deeply about and a principle our passionate volunteers uphold while offering this service.
          </p>
        </div>`;
    }
    return;
  }

  if (matchedRoute.logout) {
    const { forceLogout } = await import("./forceLogout.js");
    await forceLogout();
    return;
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
  if (matchedRoute.permission && !hasPermission(matchedRoute.permission)) {
    console.warn(`Access denied: Route requires ${matchedRoute.permission}`);
    window.location.hash = "#/"; // Redirect to home or unauthorized page
    return;
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
  updateMenuAuth();

  // ------------------------------------------------------------
  // LOAD PAGE-SPECIFIC JS
  // ------------------------------------------------------------
  if (matchedRoute.script) {
    console.log("Router: Found script definition:", matchedRoute.script);
    const ts = Date.now();
    if (Array.isArray(matchedRoute.script)) {
      for (const s of matchedRoute.script) {
        try {
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
          // ... other inits if needed
        } catch (err) {
          console.error(`Failed to load script ${s}:`, err);
        }
      }
    } else {
      let module;
      try {
        const scriptPath = "./" + matchedRoute.script;
        console.log(`Router: Importing module from ${scriptPath}`);
        module = await import(scriptPath + "?t=" + ts);
      } catch (err) {
        console.error(`Router: Failed to import ${matchedRoute.script}`, err);
        const app = document.getElementById("app");
        if (app) app.innerHTML += `<div class="p-4 text-red-600 bg-red-50 border border-red-200 rounded mt-4">
          <strong>Error loading script:</strong> ${err.message}<br>
          Check console for details.
        </div>`;
        return;
      }
      
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
      
      console.warn("Router: Module loaded but no init/profile_init function found:", module);
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