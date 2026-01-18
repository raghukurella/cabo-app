export const permissionStore = {
  permissions: [],

  set(permissions) {
    this.permissions = permissions;
  },

  has(permission) {
    return this.permissions.includes(permission);
  }
};