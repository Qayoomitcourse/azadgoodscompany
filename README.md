# Azad Goods Transport — Sanity + Netlify

This is your transport manager, restructured as a proper Vite project
that reads and writes its data (customers, transporters, shipments,
invoices) to Sanity instead of an in-memory array.

## Changelog (latest update)

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

## 3. Writes & security — read this before enabling them

This app records real money: customer bills, transporter payments,
settlements. `sanityData.js`'s `createDoc` / `patchDoc` / `removeDoc`
need a Sanity API token with write access to function, and that token
must not be visible to anyone who shouldn't be able to alter your
books.

You have two reasonable options:

**A. Read-only app, edit in Studio (safer, simplest).**
Don't set `VITE_SANITY_WRITE_TOKEN` at all. The dashboard, shipment
list, and reports all work off the read-only CDN client. Staff make
changes (new shipments, recording payments, etc.) directly in Sanity
Studio, which has its own login. `sanityData.js` will throw a clear
error if the app tries to write without a token — nothing fails
silently.

**B. Let the app write, but not from the browser.**
Create a Netlify Function that holds a write token as a *server-side*
environment variable (never prefixed `VITE_`, so it's never bundled
into client code), and have `sanityData.js`'s write functions call
that function instead of Sanity directly. This lets the in-app forms
(new shipment, record payment, etc.) work as originally designed,
without exposing the token.

If you just want to get the whole thing working quickly to see it
live, setting `VITE_SANITY_WRITE_TOKEN` directly (a token with
Editor permissions, from Sanity's API settings) is the fastest path
— just know that token becomes visible to anyone who inspects your
site's JavaScript, so treat that as a temporary/internal-network
setup, not a public launch.

## 4. Deploy to Netlify

Push this project to a GitHub repo, then in Netlify:
**Add new site → Import an existing project → GitHub → select the repo.**

Netlify should auto-detect the settings in `netlify.toml`
(`npm run build`, publish directory `dist`). In **Site settings →
Environment variables**, add the same variables from your `.env`.
Redeploy, then add the live Netlify URL to Sanity's CORS origins
(step 2) so the deployed app can actually reach your data.

## Deploying to Vercel instead

`vercel.json` in this folder covers it. In Vercel: **Add New → Project
→ import the GitHub repo.** It auto-detects Vite (build command
`npm run build`, output `dist`) — the `vercel.json` just confirms
that explicitly. Add the same `VITE_SANITY_PROJECT_ID` /
`VITE_SANITY_DATASET` (and write token, if you're using one) under
**Project Settings → Environment Variables**, then redeploy and add
the resulting `*.vercel.app` URL to Sanity's CORS origins, same as
the Netlify step. `netlify.toml` and `vercel.json` can both stay in
the repo — each platform only reads its own file.

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
