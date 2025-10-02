const STORAGE_KEY = "session";

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return !!getSession()?.accessToken;
}
