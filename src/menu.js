import { routeTable } from "./router.js";

export function init() {
  const root = document.getElementById("dynamic-menu-root");
  if (!root) return;

  // Clear existing content to prevent duplicates if init runs multiple times
  root.innerHTML = "";

  const categoryOrder = [
    "Public Pages",
    "Dashboards & Profiles",
    "Tools & Biodata",
    "Admin & Management",
    "Account & Security",
    "Development / Testing"
  ];

  const categories = {};

  // Group routes by category
  routeTable.forEach(route => {
    if (route.menuData) {
      const cat = route.menuData.category;
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(route.menuData);
    }
  });

  // Render categories in order
  categoryOrder.forEach(cat => {
    if (categories[cat]) {
      const section = document.createElement("div");
      section.className = "menu-section";
      section.innerHTML = `<h3>${cat}</h3>`;
      
      const grid = document.createElement("div");
      grid.className = "menu-grid";
      
      categories[cat].forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-card";
        card.onclick = () => window.location.hash = item.path;
        card.innerHTML = `
          <h4>${item.label}</h4>
          <p>${item.description}</p>
          <code>${item.path}</code>
        `;
        grid.appendChild(card);
      });
      
      section.appendChild(grid);
      root.appendChild(section);
    }
  });
}