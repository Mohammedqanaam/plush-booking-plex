export type UserRole = "superadmin" | "admin" | "editor" | "viewer";

export type AdminSession = {
  username: string;
  role: UserRole;
  token: string;
};

const SESSION_KEY = "admin_session";

export const getAdminSession = (): AdminSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    const session = JSON.parse(data);
    if (!session?.username || !session?.role || !session?.token) return null;
    return session as AdminSession;
  } catch {
    return null;
  }
};

export const setAdminSession = (session: AdminSession): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearAdminSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
};

export const authenticateAdmin = async (
  username: string,
  password: string
): Promise<AdminSession | null> => {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const session: AdminSession = {
      username: data.username,
      role: data.role,
      token: data.token,
    };
    setAdminSession(session);
    return session;
  } catch {
    return null;
  }
};

export const apiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const session = getAdminSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  return fetch(url, { ...options, headers });
};

export const hasPermission = (
  role: UserRole | undefined,
  action: string
): boolean => {
  if (!role) return false;
  const permissions: Record<string, UserRole[]> = {
    view: ["superadmin", "admin", "editor", "viewer"],
    upload: ["superadmin", "admin", "editor"],
    manage_users: ["superadmin", "admin"],
    manage_contacts: ["superadmin", "admin"],
    manage_settings: ["superadmin"],
    delete_users: ["superadmin"],
  };
  return permissions[action]?.includes(role) ?? false;
};

export const roleLabels: Record<UserRole, string> = {
  superadmin: "مدير أعلى",
  admin: "مدير",
  editor: "محرر",
  viewer: "مشاهد",
};
