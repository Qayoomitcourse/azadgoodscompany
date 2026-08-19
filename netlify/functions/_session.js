import crypto from "node:crypto";

// A session "token" is just  <expiryEpochMs>.<hmac>  where the hmac is
// HMAC-SHA256(AUTH_SECRET, expiryEpochMs), so it can only be produced
// by someone holding AUTH_SECRET (this server), and can be verified
// here again without any database/session store. There is nothing
// secret inside the token itself — it just proves "issued by us,
// before this expiry time".
//
// AUTH_SECRET and OWNER_PASSWORD must be set in Netlify's dashboard
// (Site settings -> Environment variables) WITHOUT a VITE_ prefix, so
// they are never bundled into the browser build. See README.md.

const SESSION_HOURS = 12;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set in the server environment.");
  return s;
}

export function issueToken() {
  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const hmac = crypto.createHmac("sha256", secret()).update(String(expiry)).digest("hex");
  return `${expiry}.${hmac}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [expiryStr, hmac] = token.split(".");
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = crypto.createHmac("sha256", secret()).update(expiryStr).digest("hex");
  const a = Buffer.from(hmac || "", "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function requireAuth(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return verifyToken(token);
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
