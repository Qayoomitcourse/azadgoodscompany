import { client } from "./sanityClient";
import { getToken } from "./auth";

// All four document types share the same read/write shape, so these
// helpers are generic rather than one-per-type. Every function maps
// Sanity's `_id` to a plain `id` field, since the rest of the app
// (ported from a local-state prototype) reads/writes `.id` everywhere.
//
// Reads go straight to Sanity's CDN (safe, read-only, no login needed).
// Writes go through /.netlify/functions/sanity-write, which checks the
// owner's session token and holds the real Sanity write token
// server-side — see netlify/functions/sanity-write.js and README.md.

async function callWriteFn(op, extra) {
  const token = getToken();
  if (!token) {
    throw new Error("You're not logged in as the owner, so this can't be saved. Please log in and try again.");
  }
  const res = await fetch("/api/sanity-write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ op, ...extra }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error("Your session expired. Please log in again.");
    throw new Error(body.error || "Save failed.");
  }
  return body;
}

export async function fetchAll(type) {
  const docs = await client.fetch(`*[_type == $type] | order(_createdAt asc)`, { type });
  return docs.map((d) => ({ ...d, id: d._id }));
}

// Single round-trip fetch for all four document types, instead of four
// separate requests. Sanity's GROQ "object projection" syntax lets one
// query return several independent result sets at once — this is what
// actually fixes the slow "Loading from Sanity…" screen, since on a
// mobile connection each extra request adds a full TLS+latency round
// trip. Used by App.jsx on mount (with a localStorage cache layered on
// top so the UI can paint instantly on repeat visits).
export async function fetchAllTypes() {
  const result = await client.fetch(`{
    "customer": *[_type == "customer"] | order(_createdAt asc),
    "transporter": *[_type == "transporter"] | order(_createdAt asc),
    "shipment": *[_type == "shipment"] | order(_createdAt asc),
    "invoice": *[_type == "invoice"] | order(_createdAt asc)
  }`);
  const withId = (arr) => (arr || []).map((d) => ({ ...d, id: d._id }));
  return {
    customers: withId(result.customer),
    transporters: withId(result.transporter),
    shipments: withId(result.shipment),
    invoices: withId(result.invoice),
  };
}

export async function createDoc(type, data) {
  return callWriteFn("create", { type, data });
}

export async function patchDoc(id, data) {
  return callWriteFn("patch", { id, data });
}

export async function removeDoc(id) {
  return callWriteFn("delete", { id });
}
