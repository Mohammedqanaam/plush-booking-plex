export type AdminUser = {
  username: string;
  password: string;
};

export type AdminSession = {
  username: string;
  role: "admin";
};

const ADMIN_USERS_KEY = "admin_users";
const ADMIN_SESSION_KEY = "admin_session";
const DEFAULT_ADMIN_USER: AdminUser = {
  username: "admin",
  password: "Worm@2026",
};

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const ensureDefaultUser = () => {
  if (typeof window === "undefined") return;
  const existing = safeParse(localStorage.getItem(ADMIN_USERS_KEY));
  if (!Array.isArray(existing)) {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify([DEFAULT_ADMIN_USER]));
    return;
  }
  const hasAdmin = existing.some(
    (user) => user?.username === DEFAULT_ADMIN_USER.username
  );
  if (!hasAdmin) {
    localStorage.setItem(
      ADMIN_USERS_KEY,
      JSON.stringify([...existing, DEFAULT_ADMIN_USER])
    );
  }
};

export const getAdminUsers = (): AdminUser[] => {
  if (typeof window === "undefined") return [DEFAULT_ADMIN_USER];
  ensureDefaultUser();
  const parsed = safeParse(localStorage.getItem(ADMIN_USERS_KEY));
  if (!Array.isArray(parsed)) return [DEFAULT_ADMIN_USER];
  return parsed.filter(
    (user) => user?.username && user?.password
  ) as AdminUser[];
};

export const addAdminUser = (username: string, password: string) => {
  if (typeof window === "undefined") return false;
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  if (!normalizedUsername || !normalizedPassword) return false;
  const users = getAdminUsers();
  if (users.some((user) => user.username === normalizedUsername)) return false;
  const nextUsers = [...users, { username: normalizedUsername, password: normalizedPassword }];
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(nextUsers));
  return true;
};

const createAdminSession = (username: string) => {
  if (typeof window === "undefined") return;
  const session: AdminSession = { username, role: "admin" };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const clearAdminSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const getAdminSession = (): AdminSession | null => {
  if (typeof window === "undefined") return null;
  ensureDefaultUser();
  const parsed = safeParse(localStorage.getItem(ADMIN_SESSION_KEY));
  if (!parsed?.username || parsed?.role !== "admin") return null;
  const users = getAdminUsers();
  const isValid = users.some((user) => user.username === parsed.username);
  if (!isValid) {
    clearAdminSession();
    return null;
  }
  return parsed as AdminSession;
};

export const authenticateAdmin = (username: string, password: string) => {
  if (typeof window === "undefined") return false;
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  if (!normalizedUsername || !normalizedPassword) return false;
  const users = getAdminUsers();
  const match = users.find(
    (user) =>
      user.username === normalizedUsername && user.password === normalizedPassword
  );
  if (!match) return false;
  createAdminSession(match.username);
  return true;
};

export const adminAuthKeys = {
  users: ADMIN_USERS_KEY,
  session: ADMIN_SESSION_KEY,
};
