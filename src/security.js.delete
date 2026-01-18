export async function hasPermission(permissionName) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return false;

  const { data, error } = await supabase
    .schema("cabo")
    .from("mm_security_user_roles")
    .select(`
      mm_security_roles (
        mm_security_role_permissions (
          mm_security_permissions ( permission_name )
        )
      )
    `)
    .eq("user_id", user.id);

  if (error || !data) {
    console.error("Permission query error:", error);
    return false;
  }

  const perms = new Set();

  data.forEach(role => {
    role.mm_security_roles.mm_security_role_permissions.forEach(rp => {
      perms.add(rp.mm_security_permissions.permission_name);
    });
  });

  return perms.has(permissionName);
}