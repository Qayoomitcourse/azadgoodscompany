// Owner-only login. The password is checked server-side (see
// netlify/functions/auth.js) — nothing secret lives in this file or in
// the browser bundle. On success we get back a signed, expiring session
// token, which we store in sessionStorage (cleared when the tab/browser
// closes) and attach to every write request afterwards.
//
// sessionStorage (not localStorage) is deliberate: on a shared or public
// computer, closing the browser logs the owner out automatically. If you
// want to stay logged in across restarts on a private device instead,
// see the "remember me" note in README.md.

const STORAGE_KEY = "azad-transport-session";

export function getToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export async function login(password) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Login failed.");
  }
  sessionStorage.setItem(STORAGE_KEY, body.token);
  return true;
}

export function logout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
