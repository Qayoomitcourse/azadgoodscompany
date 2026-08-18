import React, { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { login } from "./auth";

const INK = "#182236";
const AMBER = "#AD7A2F";
const RUST = "#9C3B2E";
const PAPER = "#F2EFE5";
const LINE = "#D6D0BF";
const CARD = "#FFFFFF";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

// Shown instead of the app until the owner enters the correct password.
// The password itself is never checked here — see
// netlify/functions/auth.js, which holds it server-side only.
export default function Login({ onSuccess }) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: INK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ background: CARD, borderRadius: 8, padding: "32px 28px", width: "100%", maxWidth: 340, boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: PAPER, margin: "0 auto 14px" }}>
          <Lock size={18} color={AMBER} />
        </div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 600, textAlign: "center", color: INK }}>AZAD GOODS</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 10.5, color: AMBER, letterSpacing: 2, textAlign: "center", marginBottom: 20 }}>TRANSPORT COMPANY</div>

        {!showForm ? (
          <>
            <p style={{ fontSize: 12.5, color: "#6B6656", textAlign: "center", margin: "0 0 20px" }}>
              This app is for the owner only. Sign in to view or edit shipments, bills, and reports.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", border: "none", borderRadius: 5, background: INK, color: "#fff", fontSize: 13.5, fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: "pointer" }}
            >
              <LogIn size={15} /> Sign in
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label style={{ display: "block", fontSize: 12, color: "#6B6656", marginBottom: 6 }}>Owner password</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${LINE}`, borderRadius: 5, fontSize: 14, fontFamily: "'Inter', sans-serif", marginBottom: 14 }}
            />

            {error && (
              <div style={{ background: "#FBEAE7", color: RUST, fontSize: 12.5, borderRadius: 5, padding: "8px 10px", marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !password}
              style={{ width: "100%", padding: "10px 12px", border: "none", borderRadius: 5, background: busy || !password ? "#C7BFAE" : INK, color: "#fff", fontSize: 13.5, fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: busy || !password ? "default" : "pointer" }}
            >
              {busy ? "Checking…" : "Log in"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 11, color: "#8A8574", textAlign: "center", marginTop: 16, marginBottom: 0 }}>
          Owner access only. You'll stay logged in until you close this browser.
        </p>
      </div>
    </div>
  );
}
