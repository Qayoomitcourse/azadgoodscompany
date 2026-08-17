import { createClient } from "@sanity/client";

// Read-only, CDN-cached client — safe to expose in the browser.
// Used for all *fetching*.
export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

// Write client — only defined if a token is present in the environment.
// See README.md ("Writes & security") before deciding whether to use this
// in the browser at all, versus routing writes through a Netlify Function.
const writeToken = import.meta.env.VITE_SANITY_WRITE_TOKEN;

export const writeClient = writeToken
  ? createClient({
      projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
      dataset: import.meta.env.VITE_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      useCdn: false,
      token: writeToken,
    })
  : null;
