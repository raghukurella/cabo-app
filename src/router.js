// ------------------------------------------------------------
// ROUTE DEFINITIONS
// ------------------------------------------------------------

const routeTable = [
  // Static routes
  { pattern: /^#\/?$/, page: "pages/landing.html", script: null },
  { pattern: /^#\/login$/, page: "pages/login.html", script: null },
  { pattern: /^#\/signup$/, page: "pages/signup.html", script: null },
  { pattern: /^#\/search$/, page: "pages/search.html", script: null },
  { pattern: /^#\/security$/, page: "pages/security.html", script: null },
  { pattern: /^#\/matchmaker$/, page: "pages/matchmaker.html", script: "matchmaker.js" },
  { pattern: /^#\/admin$/, page: "pages/admin.html", script: "admin.js" },
  { pattern: /^#\/my-profiles$/, page: "pages/my-profiles.html", script: null },

  // Dynamic routes
  { pattern: /^#\/profile\/([0-9a-fA-F-]{36})$/, page: "pages/profile.html", script: "profile.js" },
  { pattern: /^#\/profile-more\/([0-9a-fA-F-]{36})$/, page: "pages/profile-more.html", script: "profile-more.js" },
  { pattern: /^#\/profilevw\/([0-9a-fA-F-]{36})$/, page: "pages/profile-view.html", script: "profile-view.js" },
  { pattern: /^#\/menu$/, page: "pages/menu.html", script: null },
];


// ------------------------------------------------------------
// MAIN ROUTER
// ------------------------------------------------------------

async function loadPage() {
  const hash = window.location.hash || "#/";

  let matchedRoute = null;
  let params = [];

  // Match against route table
  for (const route of routeTable) {
    const match = hash.match(route.pattern);
    if (match) {
      matchedRoute = route;
      params = match.slice(1); // capture dynamic params
      break;
    }
  }

  // Fallback to landing page
  if (!matchedRoute) {
    matchedRoute = routeTable[0];
  }

  // Load HTML
  const html = await fetch(matchedRoute.page).then(res => res.text());
  const app = document.getElementById("app");
  app.innerHTML = html;

  // Re-execute inline scripts
  const scripts = app.querySelectorAll("script");
  scripts.forEach(oldScript => {
    const newScript = document.createElement("script");
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.textContent = oldScript.textContent;
    document.body.appendChild(newScript);
    oldScript.remove();
  });

  // Load page-specific JS
  if (matchedRoute.script) {
    const module = await import(`./${matchedRoute.script}`);
    if (module && typeof module.init === "function") {
      module.init(...params);
    }
  }
}


// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------

window.addEventListener("hashchange", loadPage);
window.addEventListener("load", loadPage);