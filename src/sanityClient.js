import { createClient } from "@sanity/client";

// Read-only, CDN-cached client — safe to expose in the browser, and the
// only Sanity client this app ships to the browser. All *writes*
// (create/patch/delete) go through the /.netlify/functions/sanity-write
// endpoint instead (see src/sanityData.js and netlify/functions/), so no
// write-capable Sanity token is ever bundled into client-side code.
export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});
