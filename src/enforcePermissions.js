import { hasPermission } from "./hasPermission.js";

export function enforcePermissions() {
  document.querySelectorAll("[data-permission]").forEach(el => {
    const perm = el.getAttribute("data-permission");

    if (!hasPermission(perm)) {
      el.style.display = "none";
    }
  });
}