import { client, writeClient } from "./sanityClient";

// All four document types share the same read/write shape, so these
// helpers are generic rather than one-per-type. Every function maps
// Sanity's `_id` to a plain `id` field, since the rest of the app
// (ported from a local-state prototype) reads/writes `.id` everywhere.

function stripMeta(data) {
  // Never send our local `id` (Sanity uses `_id`) or any `_`-prefixed
  // system field back to Sanity as part of a patch/create payload.
  const clean = { ...data };
  delete clean.id;
  Object.keys(clean).forEach((k) => {
    if (k.startsWith("_")) delete clean[k];
  });
  return clean;
}

function requireWriteClient() {
  if (!writeClient) {
    throw new Error(
      "No Sanity write token configured (VITE_SANITY_WRITE_TOKEN). " +
        "Either set one (see README's security note first) or edit " +
        "records in Sanity Studio instead."
    );
  }
  return writeClient;
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
  const doc = await requireWriteClient().create({ _type: type, ...stripMeta(data) });
  return { ...doc, id: doc._id };
}

export async function patchDoc(id, data) {
  return requireWriteClient().patch(id).set(stripMeta(data)).commit();
}

export async function removeDoc(id) {
  return requireWriteClient().delete(id);
}
