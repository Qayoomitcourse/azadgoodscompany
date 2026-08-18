import { createClient } from "@sanity/client";
import { requireAuth } from "./_session.js";

// Every create/patch/delete from the browser comes through here instead
// of talking to Sanity directly. Two things this buys you over exposing
// a write token to the browser:
//   1. The real Sanity write token (SANITY_WRITE_TOKEN, server-side env
//      var, no VITE_ prefix) never ships in the browser bundle.
//   2. Every write is checked against a valid owner session first, so
//      only someone who has logged in as the owner can create/edit/
//      delete records.
//
// Required Vercel environment variables (Project Settings ->
// Environment Variables, never prefixed VITE_):
//   SANITY_WRITE_TOKEN   - a Sanity API token with write access
//   AUTH_SECRET          - any long random string, used to sign sessions
//   OWNER_PASSWORD       - the login password (see api/auth.js)

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

function stripMeta(data) {
  const clean = { ...data };
  delete clean.id;
  Object.keys(clean).forEach((k) => {
    if (k.startsWith("_")) delete clean[k];
  });
  return clean;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.SANITY_WRITE_TOKEN) {
    res.status(500).json({ error: "SANITY_WRITE_TOKEN is not configured on the server." });
    return;
  }
  if (!requireAuth(req)) {
    res.status(401).json({ error: "Not logged in, or your session expired. Please log in again." });
    return;
  }

  const { op, type, id, data } = req.body || {};

  try {
    if (op === "create") {
      if (!type || !data) { res.status(400).json({ error: "Missing type/data for create." }); return; }
      const doc = await client.create({ _type: type, ...stripMeta(data) });
      res.status(200).json({ ...doc, id: doc._id });
      return;
    }
    if (op === "patch") {
      if (!id || !data) { res.status(400).json({ error: "Missing id/data for patch." }); return; }
      const result = await client.patch(id).set(stripMeta(data)).commit();
      res.status(200).json(result);
      return;
    }
    if (op === "delete") {
      if (!id) { res.status(400).json({ error: "Missing id for delete." }); return; }
      const result = await client.delete(id);
      res.status(200).json(result);
      return;
    }
    res.status(400).json({ error: `Unknown op "${op}".` });
  } catch (err) {
    res.status(500).json({ error: err.message || "Sanity write failed." });
  }
}
