# Azad Goods Transport — Sanity + Netlify

This is your transport manager, restructured as a proper Vite project
that reads and writes its data (customers, transporters, shipments,
invoices) to Sanity instead of an in-memory array.

## Changelog (latest update)

- **Owner-only login, real server-side security.** The app now opens
  on a password screen (`src/Login.jsx`) — nobody can view or change
  anything without it. Behind the scenes: `api/auth.js` (Vercel
  Serverless Function) checks the password and issues a signed,
  12-hour session; every write (new shipment, payment, edit, delete)
  is now routed through `api/sanity-write.js`, which checks that
  session and holds the real Sanity write token **server-side only**
  — it's no longer bundled into the browser at all (the old
  `VITE_SANITY_WRITE_TOKEN` approach is removed). Netlify equivalents
  ship too in `netlify/functions/`, wired up via a redirect in
  `netlify.toml`, in case you move platforms later. See section 3
  below — this needs three new environment variables
  (`OWNER_PASSWORD`, `AUTH_SECRET`, `SANITY_WRITE_TOKEN`) set in
  Vercel, and, for local dev, running `vercel dev` instead of plain
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

The app is gated behind a single owner login (`src/Login.jsx`), and
every write (new shipment, payment, edit, delete — anything that
changes your data) is checked against that login server-side. Nobody
can view or change anything without the password, and the actual
Sanity write token never ships to the browser.

**This is deployed on Vercel**, so the login/write logic lives in
`api/*.js` (Vercel Serverless Functions) — `api/auth.js` and
`api/sanity-write.js`, sharing `api/_session.js`. (Netlify equivalents
also ship in `netlify/functions/` with a `/api/*` redirect in
`netlify.toml`, in case you ever move platforms — but on Vercel it's
the `api/` folder that's actually live.)

**How it works:**
- `api/auth.js` checks the password you type against the
  `OWNER_PASSWORD` environment variable (server-side only) and, if it
  matches, issues a signed session token good for 12 hours.
- That token is kept in the browser's `sessionStorage` (cleared when
  the browser/tab is closed — so a shared/public computer doesn't stay
  logged in) and sent with every write.
- `api/sanity-write.js` is the only thing that holds the real
  `SANITY_WRITE_TOKEN`. It checks the session token on every request
  before creating, editing, or deleting anything in Sanity.
- Reads (viewing the dashboard, shipments, reports) still go straight
  to Sanity's public read-only CDN client, same as before — only
  writes and the app itself require login.

**You need three new environment variables**, set in Vercel's
**Project Settings → Environment Variables** (never prefix these with
`VITE_`, or they'd be bundled into the browser and visible to anyone):

| Variable | What it is |
|---|---|
| `OWNER_PASSWORD` | The login password. Pick something long, not your Sanity token. |
| `AUTH_SECRET` | Any long random string, e.g. `openssl rand -hex 32`. Signs sessions — changing it logs everyone out. |
| `SANITY_WRITE_TOKEN` | A Sanity API token with **Editor** (write) permissions, from Sanity's API settings. |

Add them for all three environments Vercel offers (Production,
Preview, Development) if you want previews and local `vercel dev` to
also work, then **redeploy** — new env vars don't apply to already-built
deployments.

See `.env.example` for the full list, including local-dev notes.

**Local development:** plain `vite`/`npm run dev` won't serve the
`/api/*` endpoints, so login and saving won't work locally. Install
the Vercel CLI (`npm i -g vercel`, then `vercel link` once) and run
`vercel dev` instead — it runs Vite and the API functions together on
one local URL, reading env vars from `vercel env pull` or your linked
project.

**To change or add owner passwords later:** there's currently one
shared password for "the owner." Update `OWNER_PASSWORD` in Vercel and
redeploy (existing sessions stay valid until they expire, up to 12
hours). If you'd like separate logins per staff member instead of one
shared password, that's a bigger change (a small user list plus
per-user passwords in `api/auth.js`) — let me know and I can build
that out.

## 4. Deploy to Vercel

Push this project to a GitHub repo, then in Vercel: **Add New →
Project → import the GitHub repo.** It auto-detects Vite (build
command `npm run build`, output `dist`) and auto-detects the `api/`
folder as Serverless Functions — no extra config needed beyond the
environment variables above. Add `VITE_SANITY_PROJECT_ID` /
`VITE_SANITY_DATASET` alongside the three server-side variables under
**Project Settings → Environment Variables**, redeploy, then add the
resulting `*.vercel.app` (and any custom domain) to Sanity's CORS
origins (step 2) so the deployed app can actually reach your data.

## Deploying to Netlify instead

`netlify.toml` covers the static build and includes a `/api/* ->
/.netlify/functions/:splat` redirect, so the same client code (which
calls `/api/auth` and `/api/sanity-write`) works unchanged. The actual
function code lives in `netlify/functions/` (mirrors of the `api/`
files above). In Netlify: **Add new site → Import an existing project
→ GitHub → select the repo.** Add the same environment variables
(`VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, `OWNER_PASSWORD`,
`AUTH_SECRET`, `SANITY_WRITE_TOKEN`) under **Site settings →
Environment variables**, redeploy, and add the Netlify URL to Sanity's
CORS origins.

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
