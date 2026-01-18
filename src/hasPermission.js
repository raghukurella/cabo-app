import { permissionStore } from "./permissionStore.js";

export function hasPermission(permission) {
  return permissionStore.has(permission);
}