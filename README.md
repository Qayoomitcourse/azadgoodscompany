# Azad Goods Transport — Sanity + Netlify

This is your transport manager, restructured as a proper Vite project
that reads and writes its data (customers, transporters, shipments,
invoices) to Sanity instead of an in-memory array.

## Changelog (latest update)

- **Login moved out of the app entirely, onto its own static page.**
  Visiting the site now first loads `index.html` — a plain HTML/CSS/JS
  page with the password form, no React involved — and only after a
  successful login does it send you to `/app.html`, the real
  application (previously `index.html`). This replaces the earlier
  in-app login screen, which could be skipped if a browser or CDN
  served a stale cached copy of the app's JavaScript bundle; a static
  front-door page removes that failure mode entirely.
  `vite.config.js` now builds two real HTML entry points instead of
  one, and `vercel.json` / `netlify.toml` mark both as never-cached.
  `src/App.jsx`'s login check is now a backup only (bounces to `/` if
  your session is missing/expired) — the actual gate is the page you
  land on first. `src/Login.jsx` was removed since it's no longer used.
- **Owner-only login, real server-side security.** Every write (new
  shipment, payment, edit, delete) is routed through
  `api/sanity-write.js`, which checks your session and holds the real
  Sanity write token **server-side only** — it's never bundled into
  the browser (the old `VITE_SANITY_WRITE_TOKEN` approach is removed).
  Netlify equivalents ship too in `netlify/functions/`, in case you
  move platforms. See section 3 below — this needs three environment
  variables (`OWNER_PASSWORD`, `AUTH_SECRET`, `SANITY_WRITE_TOKEN`) set
  in Vercel, and, for local dev, running `vercel dev` instead of plain
  `vite`.
- **Demo/sample data, one click to load and one click to remove.** A new
  "Demo / test data" card on the Dashboard (`Load demo data`) creates 2
  sample customers, 2 sample transporters, 6 sample shipments (mixing
  Pending/In Transit/Delivered) and one sample bill — one paid, one left
  billable — so you can click through Shipments, Billing, Invoices,
  Settlement and Reports with real-looking numbers before entering your
  actual business data. Every demo record is tagged `isDemo: true` and
  shows a small **DEMO** pill wherever it appears (Shipments, Customers,
  Transporters, Invoices). When you're ready to go live, click
  `Remove demo data` (only shown once demo data exists) to delete all of
  it in one confirmed action — your real records are never touched. This
  needs `VITE_SANITY_WRITE_TOKEN` configured, same as any other write in
  the app (see "Writes & security" below). The four schema files in
  `sanity-schemas/` each got a matching `isDemo` boolean field so it's
  also visible/filterable in Sanity Studio.
- **Vehicle No. is now its own required field** on New shipment (next
  to Customer company, which was already required) — everything else
  on that form is optional. This matches the printed register where
  the truck no. can differ trip to trip even for the same customer.
- **Shipments (database) tab** now shows Vehicle No., transporter
  paid/balance, and the linked bill's payment status all in one place,
  so it works as the single "until delivery + payment" view.
- **Billed shipments are now locked.** Once a shipment is on a
  generated bill it's shown with an amber left border and a "Locked"
  label instead of Edit/Delete — to correct it, delete the bill from
  Invoices first (which unlocks its shipments) and re-enter.
- **Customers and Transporters can now be edited**, not just added/
  deleted — click the pencil icon on any row.
- **Faster loading.** The four separate Sanity requests (customers,
  transporters, shipments, invoices) were merged into one GROQ query,
  and the last successful load is cached in the browser (localStorage)
  so returning visits paint instantly while a fresh copy loads quietly
  in the background.
- Print bill / invoice layout is unchanged — it already matches your
  paper letterhead register (date, truck no., item, sender/receiver,
  amount, labour, charge, total, grand total, signature block).

If you're deploying this over an existing Sanity dataset, add a
`vehicleNo` field to shipment documents there too — see
`sanity-schemas/shipment.js` (already updated) and either re-deploy
your Studio schema or add the field manually per document; old
shipments will just show "—" for Vehicle No. until you fill it in.

## Replacing your existing GitHub repo with this update

From inside this `azad-transport` folder:

```bash
git init                                  # skip if this folder is already a git repo
git remote add origin <your-existing-repo-url>   # e.g. https://github.com/you/azad-transport.git
git add -A
git commit -m "Vehicle No. field, locked bills, editable customers/transporters, faster load"
git branch -M main
git push origin main --force
```

Use `--force` only if you want this to fully replace what's currently
on GitHub — it overwrites the remote history with what's in this
folder. If you'd rather keep history, clone your existing repo fresh,
copy these files over it (replacing everything except `.git/`), then
commit and push normally without `--force`.

If your host (Netlify/Vercel) is already connected to that repo, the
push alone triggers a redeploy — no other steps needed.

## What's in here

```
azad-transport/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── .env.example
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx            # your app, now Sanity-backed
│   ├── sanityClient.js    # read + optional write client
│   └── sanityData.js      # generic fetch/create/patch/delete helpers
└── sanity-schemas/        # drop these into a Sanity Studio project
    ├── customer.js
    ├── transporter.js
    ├── shipment.js
    ├── invoice.js
    └── index.js
```

## 1. Create the Sanity project

```bash
npm create sanity@latest
```

Pick "Clean project with no predefined schema", name it, and let it
create a `production` dataset. Note the **project ID** it gives you.

Copy the four files from `sanity-schemas/` into that new project's
`schemaTypes/` folder, and point its `schemaTypes/index.js` at them
(or just replace it with the `index.js` in this folder). Then deploy
the Studio so your team has an admin UI to browse/edit records:

```bash
npm run deploy
```

## 2. Configure this app

```bash
cd azad-transport
npm install
cp .env.example .env
```

Edit `.env` and set `VITE_SANITY_PROJECT_ID` to the ID from step 1.
Leave `VITE_SANITY_WRITE_TOKEN` empty for now — see the security note
below before deciding whether to set it.

Sanity blocks requests from origins it doesn't recognize. In
[sanity.io/manage](https://sanity.io/manage) → your project → API →
CORS origins, add `http://localhost:5173` (for local dev) and your
Netlify URL once you have one.

```bash
npm run dev
```

The app currently loads with **no data** until you add some — either
through Sanity Studio, or through the app's own forms once writes are
enabled (next section).

## 3. Owner login & writes & security — read this before deploying

**How you reach the app has changed:** the site's root URL (`/`) is now
a plain, static login page (`index.html` — no React, no JS bundle to
go stale). Enter the owner password there; on success it sends you to
`/app.html`, which is the actual application. This two-page split
(login page vs. app page, as real separate files) exists specifically
so the password check can never be skipped by a stale cached copy of
the app's JavaScript — a problem the earlier in-app version had.

- `api/auth.js` checks the password against `OWNER_PASSWORD`
  (server-side env var) and issues a signed session token good for 12
  hours, stored in the browser's `sessionStorage` (cleared when the
  tab/browser closes).
- `app.html` (the React app) checks for that session on load; if it's
  missing or expired, it immediately bounces back to `/` rather than
  showing anything. This is a backup check — the real gate is `/`
  itself, since nothing about the app ever loads before login now.
- Every write (new shipment, payment, edit, delete) goes through
  `api/sanity-write.js`, which re-checks the session token and holds
  the real `SANITY_WRITE_TOKEN` **server-side only** — it's never
  bundled into the browser.
- Reads (viewing the dashboard, shipments, reports) go straight to
  Sanity's public read-only CDN client, same as before.

**You need three environment variables**, set in Vercel's **Project
Settings → Environment Variables** (never prefix these with `VITE_`):

| Variable | What it is |
|---|---|
| `OWNER_PASSWORD` | The login password. Pick something long, not your Sanity token. |
| `AUTH_SECRET` | Any long random string, e.g. `openssl rand -hex 32` (or, on Windows without openssl: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Signs sessions — changing it logs everyone out. |
| `SANITY_WRITE_TOKEN` | A Sanity API token with **Editor** (write) permissions, from Sanity's API settings. |

Add them for Production + Preview + Development, then **redeploy** —
new env vars don't apply to an already-built deployment.

See `.env.example` for the full list, including local-dev notes.

**Local development:** plain `vite`/`npm run dev` won't serve `/api/*`,
so login and saving won't work locally. Install the Vercel CLI
(`npm i -g vercel`, then `vercel link` once) and run `vercel dev`
instead.

**To log out:** click "Log out" at the bottom of the sidebar inside
the app — it clears your session and sends you back to `/`.

**To change the password later:** update `OWNER_PASSWORD` in Vercel
and redeploy. Existing sessions stay valid until they expire (up to 12
hours). For separate logins per staff member instead of one shared
password, that's a bigger change — ask if you'd like that built.

## 4. Deploy to Vercel

Push this project to a GitHub repo, then in Vercel: **Add New →
Project → import the GitHub repo.** It auto-detects Vite (build
command `npm run build`, output `dist`, two HTML entry points per
`vite.config.js`) and auto-detects the `api/` folder as Serverless
Functions — no extra config needed beyond the environment variables
above. Add `VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` alongside
the three server-side variables under **Project Settings →
Environment Variables**, redeploy, then add the resulting
`*.vercel.app` (and any custom domain) to Sanity's CORS origins
(step 2) so the deployed app can actually reach your data.

## Deploying to Netlify instead

`netlify.toml` covers the static build, headers, and includes a
`/api/* -> /.netlify/functions/:splat` redirect, so the same client
code (which calls `/api/auth` and `/api/sanity-write`) works
unchanged. The actual function code lives in `netlify/functions/`
(mirrors of the `api/` files above). In Netlify: **Add new site →
Import an existing project → GitHub → select the repo.** Add the same
environment variables (`VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`,
`OWNER_PASSWORD`, `AUTH_SECRET`, `SANITY_WRITE_TOKEN`) under **Site
settings → Environment variables**, redeploy, and add the Netlify URL
to Sanity's CORS origins.

## Notes on the data model

- `customerId` / `transporterId` on a shipment, and `shipmentIds` on
  an invoice, are stored as plain Sanity `_id` strings rather than
  Sanity `reference` fields — this kept the port from the original
  local-state code minimal. If you want Studio's reference-picker UI
  and automatic backlinks, that's a reasonable follow-up: change
  those fields to `type: "reference"` in the schemas and adjust the
  GROQ queries in `sanityData.js` to dereference (`->`) them.
- Every write in `App.jsx` updates local React state immediately
  alongside the Sanity call, so the UI doesn't wait on network
  round-trips. If a write fails, the local state and Sanity can drift
  out of sync — for a production rollout you'd want to surface that
  error to the user rather than only logging it.
