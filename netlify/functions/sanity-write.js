import { createClient } from "@sanity/client";
import { requireAuth } from "./_session.js";

// Every create/patch/delete from the browser now comes through here
// instead of talking to Sanity directly. Two things this buys you over
// the old VITE_SANITY_WRITE_TOKEN approach:
//   1. The real Sanity write token (SANITY_WRITE_TOKEN, server-side env
//      var, no VITE_ prefix) never ships in the browser bundle — it's
//      not visible in devtools, view-source, or the built JS at all.
//   2. Every write is checked against a valid owner session first, so
//      even someone who found the app's URL can't create/edit/delete
//      records without having logged in as the owner.
//
// Required Netlify environment variables (server-side, set in the
// Netlify dashboard, never prefixed VITE_):
//   SANITY_WRITE_TOKEN   - a Sanity API token with write access
//   AUTH_SECRET          - any long random string, used to sign sessions
//   OWNER_PASSWORD       - the login password (see auth.js)

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function stripMeta(data) {
  const clean = { ...data };
  delete clean.id;
  Object.keys(clean).forEach((k) => {
    if (k.startsWith("_")) delete clean[k];
  });
  return clean;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  if (!process.env.SANITY_WRITE_TOKEN) {
    return json(500, { error: "SANITY_WRITE_TOKEN is not configured on the server." });
  }
  if (!requireAuth(event)) {
    return json(401, { error: "Not logged in, or your session expired. Please log in again." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Bad request." });
  }

  const { op, type, id, data } = payload;

  try {
    if (op === "create") {
      if (!type || !data) return json(400, { error: "Missing type/data for create." });
      const doc = await client.create({ _type: type, ...stripMeta(data) });
      return json(200, { ...doc, id: doc._id });
    }
    if (op === "patch") {
      if (!id || !data) return json(400, { error: "Missing id/data for patch." });
      const result = await client.patch(id).set(stripMeta(data)).commit();
      return json(200, result);
    }
    if (op === "delete") {
      if (!id) return json(400, { error: "Missing id for delete." });
      const result = await client.delete(id);
      return json(200, result);
    }
    return json(400, { error: `Unknown op "${op}".` });
  } catch (err) {
    return json(500, { error: err.message || "Sanity write failed." });
  }
};
