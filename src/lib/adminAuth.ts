export type UserRole = "superadmin" | "admin" | "editor" | "viewer";

export type AdminSession = {
  username: string;
  role: UserRole;
};

export const getAdminSession = (): AdminSession | null => {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("admin_session");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.username && parsed?.role) return parsed as AdminSession;
  } catch {
    // stored value is not valid JSON – fall through and return null
  }
  return null;
};

export const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_session");
};

export const hasPermission = (role: UserRole, action: string): boolean => {
  const permissions: Record<UserRole, string[]> = {
    superadmin: ["upload", "manage_users", "delete_users", "edit_settings", "view", "manage_employees", "manage_knowledge"],
    admin: ["upload", "manage_users", "edit_settings", "view", "manage_employees", "manage_knowledge"],
    editor: ["upload", "view"],
    viewer: ["view"],
  };
  return permissions[role]?.includes(action) ?? false;
};
