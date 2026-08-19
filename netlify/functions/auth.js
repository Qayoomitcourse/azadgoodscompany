import { issueToken, safeEqual } from "./_session.js";

// POST { password } -> { token, expiresInHours } on success, 401 otherwise.
// OWNER_PASSWORD must be set in Netlify's environment variables (server
// side only, no VITE_ prefix). This is intentionally a single shared
// password for "the owner" rather than per-user accounts — see README
// if you later want individual staff logins instead.
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword) {
    return { statusCode: 500, body: JSON.stringify({ error: "OWNER_PASSWORD is not configured on the server." }) };
  }

  let password;
  try {
    ({ password } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad request." }) };
  }

  if (!password || !safeEqual(password, ownerPassword)) {
    // Same generic message either way — don't reveal which part was wrong.
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ token: issueToken(), expiresInHours: 12 }),
  };
};
