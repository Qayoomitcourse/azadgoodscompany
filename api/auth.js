import { issueToken, safeEqual } from "./_session.js";

// POST { password } -> { token, expiresInHours } on success, 401 otherwise.
// OWNER_PASSWORD must be set in Vercel's environment variables (server
// side only, no VITE_ prefix).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword) {
    res.status(500).json({ error: "OWNER_PASSWORD is not configured on the server." });
    return;
  }

  const { password } = req.body || {};

  if (!password || !safeEqual(password, ownerPassword)) {
    // Same generic message either way — don't reveal which part was wrong.
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  res.status(200).json({ token: issueToken(), expiresInHours: 12 });
}
