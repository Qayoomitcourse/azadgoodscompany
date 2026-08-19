import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Two real HTML entry points, not one SPA shell:
//   index.html - the static login page (see file itself), the site's
//                 actual front door.
//   app.html   - the React app (src/main.jsx), only ever reached after
//                 a successful login.
// This keeps the password check completely outside of React/Vite's
// JS bundle, so it can't be affected by bundle caching or hydration
// timing — see README.md ("Owner login") for the full explanation.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
      },
    },
  },
});
