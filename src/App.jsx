import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  PackagePlus,
  Truck,
  Users,
  Receipt,
  Wallet,
  ClipboardList,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Printer,
  FileBarChart2,
  Download,
  Archive,
  Eye,
  FlaskConical,
  LogOut,
} from "lucide-react";
import { fetchAllTypes, createDoc, patchDoc, removeDoc } from "./sanityData";
import { logout, isLoggedIn } from "./auth";

const CACHE_KEY = "azad-transport-cache-v1";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Nastaliq+Urdu:wght@500;700&family=Playfair+Display:ital,wght@1,700;1,900&display=swap');`;

// Mobile-responsive rules. The rest of this file is styled with inline
// style objects (so specific values here need `!important` to win over
// them). Targets a handful of className hooks added to key layout
// elements below — the sidebar, main content area, form/metric grids,
// and every on-screen data table.
const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  @keyframes agt-spin { to { transform: rotate(360deg); } }
  @media (max-width: 880px) {
    .app-shell { flex-direction: column !important; }
    .sidebar {
      width: 100% !important;
      flex-direction: row !important;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 10px 12px !important;
      gap: 4px !important;
      align-items: center;
    }
    .sidebar > div:first-child { display: none; }
    .sidebar button {
      flex-direction: column;
      white-space: nowrap;
      font-size: 10.5px !important;
      padding: 7px 10px !important;
      gap: 4px !important;
      flex-shrink: 0;
    }
    .main-content {
      padding: 14px 14px 28px !important;
      max-width: 100% !important;
    }
    .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .metrics-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
    .split-grid { grid-template-columns: 1fr !important; }
    .form-grid-3 { grid-template-columns: 1fr !important; }
    .ship-row-grid {
      grid-template-columns: 1fr !important;
      row-gap: 4px !important;
    }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  }
  @media (max-width: 480px) {
    .metrics-grid, .metrics-grid-4 { grid-template-columns: 1fr !important; }
  }
`;

const BILL_BLUE = "#1a3363";

const INK = "#182236";
const STEEL = "#3B5B80";
const AMBER = "#AD7A2F";
const RUST = "#9C3B2E";
const GREEN = "#3C6B2E";
const PAPER = "#F2EFE5";
const LINE = "#D6D0BF";
const CARD = "#FFFFFF";

const COMPANY = {
  name: "AZAD GOODS TRANSPORT COMPANY",
  address: "Main Super Highway Road No. 6 Side Nooriabad",
  prop: "MANZOOR ALI RAHIMOON",
  phones: "0345-3931888, 0334-1125613",
};

const CUSTOMER_PAYMENT_METHODS = ["Cash", "Cheque", "Online Transfer"];
const TRANSPORTER_PAYMENT_METHODS = ["Cash", "JazzCash", "Bank Transfer"];

function pkr(n) {
  const v = Math.round(Number(n) || 0);
  return "Rs. " + v.toLocaleString("en-PK");
}
function num(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("en-PK");
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDMY(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
function invoiceSerialStr(n, isoDate) {
  const year = (isoDate || todayISO()).slice(0, 4);
  return String(n).padStart(4, "0") + "/" + year;
}
function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Local seed data has been removed — customers, transporters, shipments,
// and invoices are now loaded from Sanity on mount (see the useEffect in
// App() below) instead of starting from hard-coded arrays.

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "new", label: "New shipment", icon: PackagePlus },
  { key: "shipments", label: "Shipments", icon: ClipboardList },
  { key: "customers", label: "Customers", icon: Users },
  { key: "transporters", label: "Transporters", icon: Truck },
  { key: "billing", label: "Print bill", icon: Receipt },
  { key: "invoices", label: "Invoices", icon: Archive },
  { key: "settlement", label: "Transporter settlement", icon: Wallet },
  { key: "reports", label: "Reports", icon: FileBarChart2 },
];

function Stamp({ children }) {
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: AMBER, border: `1px solid ${AMBER}`, borderRadius: 3, padding: "1px 7px", letterSpacing: 0.5 }}>
      {children}
    </span>
  );
}

function RouteLine({ from, to }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: STEEL }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STEEL, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 24, borderTop: `1.5px dashed ${LINE}`, height: 0 }} />
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: RUST, flexShrink: 0 }} />
      <span style={{ marginLeft: 4, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
        {from} <ArrowRight size={11} style={{ verticalAlign: "-1px", margin: "0 2px" }} /> {to}
      </span>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: "16px 18px", ...style }}>{children}</div>;
}

function MetricCard({ label, value, accent }) {
  return (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: "#6B6656", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 21, fontWeight: 500, color: accent || INK }}>{value}</div>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: "#5B5645" }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle = { border: `1px solid ${LINE}`, borderRadius: 4, padding: "7px 9px", fontSize: 13.5, fontFamily: "'Inter', sans-serif", background: "#FBFAF6", color: INK };
const btnPrimary = { background: INK, color: "#F2EFE5", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
const btnGhost = { background: "transparent", color: INK, border: `1px solid ${LINE}`, borderRadius: 4, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
const iconBtn = { background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, display: "inline-flex" };

function StatusBadge({ status }) {
  const map = { Delivered: { bg: "#E6EEE2", fg: GREEN }, "In Transit": { bg: "#EFE6D3", fg: AMBER }, Pending: { bg: "#F0E2DD", fg: RUST } };
  const c = map[status] || map.Pending;
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>
      {status}
    </span>
  );
}

// Small pill used to flag demo/sample records anywhere they appear
// on screen, so they're never mistaken for real data.
function Tag({ text, color }) {
  return (
    <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: color, borderRadius: 3, padding: "1px 5px", verticalAlign: "middle" }}>
      {text}
    </span>
  );
}

function PaymentBadge({ payment }) {
  if (!payment) {
    return (
      <span style={{ background: "#F0E2DD", color: RUST, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Payment pending
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
      <span style={{ background: "#E6EEE2", color: GREEN, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Received &middot; {payment.method}
      </span>
      <span style={{ fontSize: 11.5, color: "#6B6656", fontFamily: "'IBM Plex Mono', monospace" }}>
        {pkr(payment.amount)}{payment.ref ? ` · ${payment.ref}` : ""}{payment.date ? ` · ${fmtDMY(payment.date)}` : ""}
      </span>
    </div>
  );
}

// ---------- Record customer payment modal ----------
function PaymentModal({ invoice, customerName, form, setForm, onSave, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,34,54,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: CARD, borderRadius: 8, padding: 22, width: 340, boxShadow: "0 12px 32px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16 }}>Record payment</div>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "#6B6656", marginBottom: 14 }}>
          Bill <Stamp>#{invoice.serial}</Stamp> &middot; {customerName} &middot; {pkr(invoice.total)} total
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Amount received">
            <input style={inputStyle} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Method">
            <select style={inputStyle} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {CUSTOMER_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reference (cheque / txn no.)">
            <input style={inputStyle} value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="optional" />
          </Field>
          <Field label="Date received">
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <button onClick={onSave} style={{ ...btnPrimary, justifyContent: "center", marginTop: 4 }}>Save payment</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Letterhead badge: bold "T" with a curving highway swoosh, matching the printed letterhead ----------
function RoadBadge({ flip }) {
  return (
    <svg width="96" height="64" viewBox="0 0 130 90" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M2,18 L58,18 L58,32 L38,32 L38,84 L22,84 L22,32 L2,32 Z" fill={BILL_BLUE} />
      <path d="M8,92 C14,66 30,42 58,26 C82,13 102,9 128,2 L122,10 C100,16 82,22 60,38 C36,54 24,72 40,92 Z" fill={BILL_BLUE} />
      <path d="M20,86 C30,62 46,42 70,26 C90,15 105,11 122,5" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeDasharray="6.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function RuleFlourish({ align }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2.5, flex: 1, alignItems: align === "left" ? "flex-end" : "flex-start", padding: "0 10px" }}>
      {bars.map((i) => (
        <div key={i} style={{ height: 1.3, background: BILL_BLUE, width: `${94 - i * 6}%`, opacity: 0.9 }} />
      ))}
    </div>
  );
}

// ---------- Print bill (matches the physical register) ----------
function PrintBill({ data, onClose }) {
  const { serial, customerName, rows, grandTotal, previousBalance, previousBalanceRefs } = data;
  const totalDue = grandTotal + (previousBalance || 0);
  const padded = [...rows];
  while (padded.length < 6) padded.push(null);
  const cols = [
    { en: "Date", ur: "تاریخ" },
    { en: "Truck No.", ur: "ٹرک نمبر" },
    { en: "Item", ur: "مال" },
    { en: "Bhejhny Wala", ur: "بھیجنے والا" },
    { en: "Received", ur: "وصول کنندہ" },
    { en: "Amount", ur: "کرایہ" },
    { en: "Labour", ur: "مزدوری" },
    { en: "Charge", ur: "چارج" },
    { en: "Total", ur: "ٹوٹل" },
  ];
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#111" }}>
      <style>{FONT_IMPORT}{`
        @media print { .no-print { display: none !important; } @page { size: A4; margin: 10mm; } }
      `}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: 14, background: PAPER, borderBottom: `1px solid ${LINE}` }}>
        <button style={btnGhost} onClick={onClose}><X size={14} /> Close</button>
        <button style={btnPrimary} onClick={() => window.print()}><Printer size={14} /> Print / save as PDF</button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 26px 40px", border: `2.5px solid ${BILL_BLUE}`, color: BILL_BLUE }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <RoadBadge />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 900, fontSize: 33, color: BILL_BLUE, letterSpacing: 0.5, lineHeight: 1.1 }}>{COMPANY.name}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: BILL_BLUE, marginTop: 3 }}>Address: {COMPANY.address}</div>
          </div>
          <RoadBadge flip />
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "10px 0 0" }}>
          <RuleFlourish align="left" />
          <div style={{ border: `1.8px solid ${BILL_BLUE}`, borderRadius: 30, padding: "6px 22px", textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>PROP : {COMPANY.prop}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{COMPANY.phones}</div>
          </div>
          <RuleFlourish align="right" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "16px 2px 6px" }}>
          <div style={{ fontSize: 14 }}>
            <b style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}>{serial}</b>
            <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: 15, marginLeft: 10, borderBottom: `1px solid ${BILL_BLUE}`, paddingBottom: 1 }}>سیریل نمبر</span>
          </div>
          <div style={{ fontSize: 13, textAlign: "right" }}>
            <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: 22, fontWeight: 700 }}>جناب</span>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>M/S {customerName}</div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 6 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.en} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", background: "#eef1f6" }}>
                  <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: 13 }}>{c.ur}</div>
                  <div style={{ fontWeight: 600 }}>{c.en}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {padded.map((r, i) => (
              <tr key={i} style={{ height: 30 }}>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace" }}>{r ? fmtDMY(r.date) : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace" }}>{r ? r.truckNo : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px" }}>{r ? r.item : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px" }}>{r ? r.sender : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px" }}>{r ? r.receiver : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace" }}>{r ? num(r.customerRate) : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace" }}>{r ? num(r.labour) : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace" }}>{r && r.other ? num(r.other) : r ? "—" : ""}</td>
                <td style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "3px 6px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{r ? num(r.total) : ""}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700 }}>Grand Total</td>
              <td colSpan={5} style={{ border: `1.3px solid ${BILL_BLUE}` }}></td>
              <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{num(grandTotal)}</td>
            </tr>
            {!!previousBalance && (
              <tr>
                <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700 }}>
                  Previous Balance b/f{previousBalanceRefs && previousBalanceRefs.length ? ` (Bill # ${previousBalanceRefs.join(", ")})` : ""}
                </td>
                <td colSpan={5} style={{ border: `1.3px solid ${BILL_BLUE}` }}></td>
                <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{num(previousBalance)}</td>
              </tr>
            )}
            {!!previousBalance && (
              <tr>
                <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700, background: "#eef1f6" }}>Total Payable</td>
                <td colSpan={5} style={{ border: `1.3px solid ${BILL_BLUE}`, background: "#eef1f6" }}></td>
                <td colSpan={2} style={{ border: `1.3px solid ${BILL_BLUE}`, padding: "6px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", background: "#eef1f6" }}>{num(totalDue)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 700 }}>COST/BAIG</div>
            <div style={{ marginTop: 26, borderTop: `1px solid ${BILL_BLUE}`, width: 180, paddingTop: 4 }}>Signature</div>
          </div>
          <div style={{ textAlign: "right" }}>
            Average: <b style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{num(rows.length ? grandTotal / rows.length : 0)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Print report (generic tabular) ----------
function PrintReport({ data, onClose }) {
  const { title, subtitle, columns, rows, totals } = data;
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#111" }}>
      <style>{`@media print { .no-print { display: none !important; } @page { size: A4; margin: 10mm; } }`}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: 14, background: PAPER, borderBottom: `1px solid ${LINE}` }}>
        <button style={btnGhost} onClick={onClose}><X size={14} /> Close</button>
        <button style={btnPrimary} onClick={() => window.print()}><Printer size={14} /> Print / save as PDF</button>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 22px 40px" }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: "#16213a" }}>{COMPANY.name}</div>
        <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#777", marginBottom: 16 }}>{subtitle}</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>{columns.map((c) => <th key={c} style={{ border: "1px solid #999", padding: "5px 7px", background: "#eef1f6", textAlign: "left" }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} style={{ border: "1px solid #999", padding: "5px 7px" }}>{c}</td>)}</tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr>{totals.map((c, j) => <td key={j} style={{ border: "1px solid #999", padding: "6px 7px", fontWeight: 700 }}>{c}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function AppShell() {
  const [view, setView] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [printBillData, setPrintBillData] = useState(null);
  const [printReportData, setPrintReportData] = useState(null);
  const [invoiceSerial, setInvoiceSerial] = useState(1);
  const [invoices, setInvoices] = useState([]);
  // true only for the very first load ever (no cache to show yet).
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  function applyData({ customers: c, transporters: t, shipments: s, invoices: i }) {
    setCustomers(c);
    setTransporters(t);
    setShipments(s);
    setInvoices(i);
    const nums = i.map((inv) => parseInt(String(inv.serial).split("/")[0], 10) || 0);
    setInvoiceSerial((nums.length ? Math.max(...nums) : 0) + 1);
  }

  // Load everything from Sanity once on mount, in a single request
  // (fetchAllTypes) instead of four. A copy of the last successful load
  // is kept in localStorage so returning visits paint instantly with
  // that cached data while a fresh copy loads quietly in the background
  // — this is what fixes the "stuck on Loading from Sanity…" feeling.
  useEffect(() => {
    let cancelled = false;

    const cached = (() => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    if (cached) {
      applyData(cached);
      setLoading(false);
      setRefreshing(true);
    }

    fetchAllTypes()
      .then((data) => {
        if (cancelled) return;
        applyData(data);
        setLoadError(null);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          /* storage full or unavailable — safe to ignore, cache is best-effort */
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // If we already have cached data on screen, a background refresh
        // failure (e.g. offline) shouldn't block the UI — just note it.
        if (!cached) setLoadError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const customerById = (id) => customers.find((c) => c.id === id);
  const transporterById = (id) => transporters.find((t) => t.id === id);

  // ---- demo / sample data (for trying the app out before go-live) ----
  // Everything created here is tagged isDemo: true so it can be told
  // apart on screen (a "DEMO" pill) and removed in one click with
  // clearDemoData() once real data entry starts — see the card on the
  // Dashboard. Needs a Sanity write token configured, same as any other
  // write in this app.
  const hasDemoData =
    customers.some((c) => c.isDemo) ||
    transporters.some((t) => t.isDemo) ||
    shipments.some((s) => s.isDemo) ||
    invoices.some((i) => i.isDemo);
  const [demoBusy, setDemoBusy] = useState(false);

  async function seedDemoData() {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      const c1 = await createDoc("customer", { name: "Sindh Traders (Demo)", contact: "Imran", phone: "0300-1112233", city: "Karachi", address: "Site Area, Karachi", terms: "15 days", isDemo: true });
      const c2 = await createDoc("customer", { name: "Punjab Agro Mills (Demo)", contact: "Bilal", phone: "0321-4445566", city: "Multan", address: "Industrial Estate, Multan", terms: "30 days", isDemo: true });
      setCustomers((prev) => [...prev, c1, c2]);

      const t1 = await createDoc("transporter", { name: "Akram Goods Carrier (Demo)", driver: "Akram", mobile: "0333-1122334", truckNo: "JT-0194", truckType: "10 Wheeler", isDemo: true });
      const t2 = await createDoc("transporter", { name: "Shahid Transport (Demo)", driver: "Shahid", mobile: "0345-9988776", truckNo: "TLA-8821", truckType: "Mazda", isDemo: true });
      setTransporters((prev) => [...prev, t1, t2]);

      const today = todayISO();
      const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
      const demoShipmentDefs = [
        { date: daysAgo(21), customerId: c1.id, vehicleNo: t1.truckNo, item: "Cement", qty: "200 Bags", pickup: "Karachi", delivery: "Hyderabad", truckType: "10 Wheeler", customerRate: 28000, transporterId: t1.id, transporterRate: 24000, labour: 500, other: 0, receiver: "Waheed", status: "Delivered", transporterPaid: 24000 },
        { date: daysAgo(18), customerId: c1.id, vehicleNo: t2.truckNo, item: "Rice", qty: "300 Bags", pickup: "Karachi", delivery: "Sukkur", truckType: "Mazda", customerRate: 32000, transporterId: t2.id, transporterRate: 27000, labour: 400, other: 200, receiver: "Nasir", status: "Delivered", transporterPaid: 27000 },
        { date: daysAgo(12), customerId: c2.id, vehicleNo: t1.truckNo, item: "Fertilizer", qty: "150 Bags", pickup: "Multan", delivery: "Lahore", truckType: "10 Wheeler", customerRate: 21000, transporterId: t1.id, transporterRate: 17500, labour: 300, other: 0, receiver: "Kashif", status: "Delivered", transporterPaid: 10000 },
        { date: daysAgo(7), customerId: c2.id, vehicleNo: t2.truckNo, item: "Wheat", qty: "250 Bags", pickup: "Multan", delivery: "Faisalabad", truckType: "Mazda", customerRate: 19000, transporterId: t2.id, transporterRate: 15000, labour: 300, other: 0, receiver: "Sohail", status: "In Transit", transporterPaid: 0 },
        { date: daysAgo(3), customerId: c1.id, vehicleNo: t1.truckNo, item: "Sugar", qty: "180 Bags", pickup: "Karachi", delivery: "Larkana", truckType: "10 Wheeler", customerRate: 26000, transporterId: t1.id, transporterRate: 21000, labour: 400, other: 0, receiver: "Zubair", status: "Pending", transporterPaid: 0 },
        { date: today, customerId: c2.id, vehicleNo: t2.truckNo, item: "Cotton bales", qty: "90 Bales", pickup: "Multan", delivery: "Karachi", truckType: "Mazda", customerRate: 34000, transporterId: t2.id, transporterRate: 29000, labour: 500, other: 300, receiver: "Adeel", status: "Pending", transporterPaid: 0 },
      ];
      const createdShipments = [];
      for (const def of demoShipmentDefs) {
        const s = await createDoc("shipment", { orderNo: nextOrderNo.replace(/\d+$/, (m) => String(Number(m) + createdShipments.length).padStart(6, "0")), ...def, invoiced: false, invoiceSerial: null, transporterPayMethod: def.transporterPaid ? "Cash" : "", transporterPayRef: "", isDemo: true });
        createdShipments.push(s);
      }
      setShipments((prev) => [...prev, ...createdShipments]);

      // one paid, one outstanding demo bill, covering the first two (already delivered) shipments
      const [s1, s2] = createdShipments;
      const genDate = daysAgo(2);
      const serial = invoiceSerialStr(invoiceSerial, genDate);
      const total = s1.customerRate + s1.labour + s1.other;
      const inv1 = await createDoc("invoice", { serial, customerId: c1.id, generatedDate: genDate, shipmentIds: [s1.id], total, payment: { amount: total, method: "Bank Transfer", ref: "DEMO-TXN-001", date: daysAgo(1) }, previousBalance: 0, previousBalanceRefs: [], carriedForward: false, isDemo: true });
      await patchDoc(s1.id, { invoiced: true, invoiceSerial: serial });
      setShipments((prev) => prev.map((s) => (s.id === s1.id ? { ...s, invoiced: true, invoiceSerial: serial } : s)));
      setInvoices((prev) => [...prev, inv1]);
      setInvoiceSerial((n) => n + 1);
      void s2; // second delivered demo shipment is left uninvoiced on purpose, to show up as billable
    } catch (err) {
      window.alert("Couldn't load demo data: " + err.message);
    } finally {
      setDemoBusy(false);
    }
  }

  async function clearDemoData() {
    if (demoBusy) return;
    if (!window.confirm("Remove all demo/sample records (customers, transporters, shipments and bills tagged as demo)? This cannot be undone. Your real data is untouched.")) return;
    setDemoBusy(true);
    try {
      const demoInvoices = invoices.filter((i) => i.isDemo);
      const demoShipments = shipments.filter((s) => s.isDemo);
      const demoCustomers = customers.filter((c) => c.isDemo);
      const demoTransporters = transporters.filter((t) => t.isDemo);
      // invoices first (they lock shipments), then shipments, then parties
      await Promise.all(demoInvoices.map((i) => removeDoc(i.id)));
      await Promise.all(demoShipments.map((s) => removeDoc(s.id)));
      await Promise.all(demoCustomers.map((c) => removeDoc(c.id)));
      await Promise.all(demoTransporters.map((t) => removeDoc(t.id)));
      setInvoices((prev) => prev.filter((i) => !i.isDemo));
      setShipments((prev) => prev.filter((s) => !s.isDemo));
      setCustomers((prev) => prev.filter((c) => !c.isDemo));
      setTransporters((prev) => prev.filter((t) => !t.isDemo));
    } catch (err) {
      window.alert("Couldn't remove all demo data: " + err.message);
    } finally {
      setDemoBusy(false);
    }
  }

  const nextOrderNo = useMemo(() => {
    const nums = shipments.map((s) => parseInt(s.orderNo.split("-")[1], 10) || 0);
    const max = nums.length ? Math.max(...nums) : 124;
    return "AGT-" + String(max + 1).padStart(6, "0");
  }, [shipments]);

  const enriched = shipments.map((s) => {
    const total = s.customerRate + s.labour + s.other;
    const margin = s.customerRate - s.transporterRate;
    const profit = s.customerRate - s.transporterRate - s.labour - s.other;
    return { ...s, total, margin, profit };
  });

  const totalOrders = shipments.length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;
  const inTransit = shipments.filter((s) => s.status !== "Delivered").length;
  const totalBilling = enriched.reduce((a, s) => a + s.total, 0);
  const totalTransporterCost = enriched.reduce((a, s) => a + s.transporterRate, 0);
  const netProfit = enriched.reduce((a, s) => a + s.profit, 0);
  const payable = shipments.reduce((a, s) => a + (s.transporterRate - (s.transporterPaid || 0)), 0);
  const uninvoicedCount = shipments.filter((s) => !s.invoiced).length;

  // ---- dashboard period filter ----
  const [dashFrom, setDashFrom] = useState("");
  const [dashTo, setDashTo] = useState("");
  const dashRows = enriched.filter((s) => (!dashFrom || s.date >= dashFrom) && (!dashTo || s.date <= dashTo));
  const dashReceived = dashRows.length;
  const dashDelivered = dashRows.filter((s) => s.status === "Delivered").length;
  const dashPending = dashRows.filter((s) => s.status !== "Delivered").length;

  // ---- shipment form (add + edit) ----
  const blankShipment = { date: todayISO(), customerId: customers[0]?.id || "", vehicleNo: "", item: "", qty: "", pickup: "", delivery: "", truckType: "", customerRate: "", transporterId: "", transporterRate: "", labour: "", other: "", receiver: "", status: "Pending" };
  const [shipForm, setShipForm] = useState(blankShipment);
  const [editingId, setEditingId] = useState(null);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [showQuickTransporter, setShowQuickTransporter] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "", city: "" });
  const [quickTransporter, setQuickTransporter] = useState({ name: "", truckNo: "", truckType: "" });

  const blankCustomer = { name: "", contact: "", phone: "", city: "", address: "", terms: "" };
  const [custForm, setCustForm] = useState(blankCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const blankTransporter = { name: "", driver: "", mobile: "", truckNo: "", truckType: "" };
  const [transForm, setTransForm] = useState(blankTransporter);
  const [editingTransporterId, setEditingTransporterId] = useState(null);

  function startEdit(s) {
    if (s.invoiceSerial) { window.alert("This shipment is on a generated bill and is locked. Delete the bill first (from Invoices) if it needs correcting."); return; }
    setEditingId(s.id);
    setShipForm({ ...s });
    setView("new");
  }
  function cancelEdit() {
    setEditingId(null);
    setShipForm(blankShipment);
  }

  async function submitShipment(e) {
    e.preventDefault();
    // Only Customer is mandatory. Vehicle No. comes from the selected
    // transporter automatically (see the "new" form) — if no
    // transporter is assigned yet, the order still saves fine, with
    // status defaulting to Pending, and can be completed later from
    // the Shipments page (Edit).
    if (!shipForm.customerId) { window.alert("Please select or add a customer company."); return; }
    const clean = {
      ...shipForm,
      customerRate: Number(shipForm.customerRate) || 0,
      transporterRate: Number(shipForm.transporterRate) || 0,
      labour: Number(shipForm.labour) || 0,
      other: Number(shipForm.other) || 0,
    };
    if (editingId) {
      await patchDoc(editingId, clean);
      setShipments((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...clean } : s)));
      setEditingId(null);
    } else {
      const withDefaults = { orderNo: nextOrderNo, ...clean, transporterPaid: 0, invoiced: false, invoiceSerial: null, transporterPayMethod: "", transporterPayRef: "" };
      const created = await createDoc("shipment", withDefaults);
      setShipments((prev) => [...prev, created]);
    }
    setShipForm(blankShipment);
    setView("shipments");
  }

  async function deleteShipment(id) {
    const s = shipments.find((sh) => sh.id === id);
    if (s?.invoiceSerial) { window.alert("This shipment is on a generated bill and is locked. Delete the bill first (from Invoices) if it needs to be removed."); return; }
    if (window.confirm("Delete this shipment order? This cannot be undone.")) {
      await removeDoc(id);
      setShipments((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function saveQuickCustomer() {
    if (!quickCustomer.name) return;
    const data = { name: quickCustomer.name, contact: "", phone: quickCustomer.phone, city: quickCustomer.city, address: "", terms: "" };
    const c = await createDoc("customer", data);
    setCustomers((prev) => [...prev, c]);
    setShipForm((f) => ({ ...f, customerId: c.id }));
    setQuickCustomer({ name: "", phone: "", city: "" });
    setShowQuickCustomer(false);
  }
  async function saveQuickTransporter() {
    if (!quickTransporter.name) return;
    const data = { name: quickTransporter.name, driver: "", mobile: "", truckNo: quickTransporter.truckNo, truckType: quickTransporter.truckType };
    const t = await createDoc("transporter", data);
    setTransporters((prev) => [...prev, t]);
    setShipForm((f) => ({ ...f, transporterId: t.id, vehicleNo: t.truckNo || f.vehicleNo }));
    setQuickTransporter({ name: "", truckNo: "", truckType: "", normalRate: "" });
    setShowQuickTransporter(false);
  }

  async function submitCustomer(e) {
    e.preventDefault();
    if (!custForm.name) return;
    if (editingCustomerId) {
      await patchDoc(editingCustomerId, custForm);
      setCustomers((prev) => prev.map((c) => (c.id === editingCustomerId ? { ...c, ...custForm } : c)));
      setEditingCustomerId(null);
    } else {
      const created = await createDoc("customer", custForm);
      setCustomers((prev) => [...prev, created]);
    }
    setCustForm(blankCustomer);
  }
  function startEditCustomer(c) {
    setEditingCustomerId(c.id);
    setCustForm({ name: c.name || "", contact: c.contact || "", phone: c.phone || "", city: c.city || "", address: c.address || "", terms: c.terms || "" });
  }
  function cancelEditCustomer() {
    setEditingCustomerId(null);
    setCustForm(blankCustomer);
  }
  async function deleteCustomer(id) {
    if (shipments.some((s) => s.customerId === id)) { window.alert("This customer has shipment orders on record and can't be deleted."); return; }
    if (window.confirm("Delete this customer?")) {
      await removeDoc(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (editingCustomerId === id) cancelEditCustomer();
    }
  }
  async function submitTransporter(e) {
    e.preventDefault();
    if (!transForm.name) return;
    if (editingTransporterId) {
      await patchDoc(editingTransporterId, transForm);
      setTransporters((prev) => prev.map((t) => (t.id === editingTransporterId ? { ...t, ...transForm } : t)));
      setEditingTransporterId(null);
    } else {
      const created = await createDoc("transporter", transForm);
      setTransporters((prev) => [...prev, created]);
    }
    setTransForm(blankTransporter);
  }
  function startEditTransporter(t) {
    setEditingTransporterId(t.id);
    setTransForm({ name: t.name || "", driver: t.driver || "", mobile: t.mobile || "", truckNo: t.truckNo || "", truckType: t.truckType || "" });
  }
  function cancelEditTransporter() {
    setEditingTransporterId(null);
    setTransForm(blankTransporter);
  }
  async function deleteTransporter(id) {
    if (shipments.some((s) => s.transporterId === id)) { window.alert("This transporter has shipment orders on record and can't be deleted."); return; }
    if (window.confirm("Delete this transporter?")) {
      await removeDoc(id);
      setTransporters((prev) => prev.filter((t) => t.id !== id));
      if (editingTransporterId === id) cancelEditTransporter();
    }
  }

  function setPaid(shipmentId, value) {
    const transporterPaid = Number(value) || 0;
    patchDoc(shipmentId, { transporterPaid });
    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, transporterPaid } : s)));
  }
  function setTransporterPayMethod(shipmentId, value) {
    patchDoc(shipmentId, { transporterPayMethod: value });
    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, transporterPayMethod: value } : s)));
  }
  function setTransporterPayRef(shipmentId, value) {
    patchDoc(shipmentId, { transporterPayRef: value });
    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, transporterPayRef: value } : s)));
  }
  function setStatus(shipmentId, value) {
    patchDoc(shipmentId, { status: value });
    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, status: value } : s)));
  }
  function toggleInvoiced(shipmentId) {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;
        const next = { ...s, invoiced: !s.invoiced, invoiceSerial: !s.invoiced ? s.invoiceSerial : null };
        patchDoc(shipmentId, { invoiced: next.invoiced, invoiceSerial: next.invoiceSerial });
        return next;
      })
    );
  }

  // ---- billing / print bill ----
  const [billCustomer, setBillCustomer] = useState(customers[0]?.id || "");
  const [billFrom, setBillFrom] = useState("");
  const [billTo, setBillTo] = useState("");
  const [selectedIds, setSelectedIds] = useState({});

  const billCandidates = enriched.filter(
    (s) => s.customerId === billCustomer && !s.invoiced && (!billFrom || s.date >= billFrom) && (!billTo || s.date <= billTo)
  );
  useEffect(() => {
    const map = {};
    billCandidates.forEach((s) => (map[s.id] = true));
    setSelectedIds(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billCustomer, billFrom, billTo, shipments.length]);

  const selectedRows = billCandidates.filter((s) => selectedIds[s.id]);
  const selectedTotal = selectedRows.reduce((a, s) => a + s.total, 0);

  function buildBillRows(shipmentList, senderName) {
    return shipmentList.map((s) => ({
      date: s.date,
      truckNo: s.vehicleNo || transporterById(s.transporterId)?.truckNo || "—",
      item: s.item,
      sender: senderName,
      receiver: s.receiver,
      customerRate: s.customerRate,
      labour: s.labour,
      other: s.other,
      total: s.customerRate + s.labour + s.other,
    }));
  }

  async function generateBill() {
    if (selectedRows.length === 0) return;
    const senderName = customerById(billCustomer)?.name || "";
    const rows = buildBillRows(selectedRows, senderName);
    const genDate = todayISO();
    const serial = invoiceSerialStr(invoiceSerial, genDate);
    const shipmentIds = selectedRows.map((s) => s.id);

    // any of this customer's earlier bills that are still outstanding and not already
    // carried forward onto a later bill get rolled into this one, referenced by bill #.
    const outstanding = invoices.filter(
      (i) => i.customerId === billCustomer && !i.carriedForward && i.total - (i.payment?.amount || 0) > 0
    );
    const previousBalance = outstanding.reduce((a, i) => a + (i.total - (i.payment?.amount || 0)), 0);
    const previousBalanceRefs = outstanding.map((i) => i.serial);

    const newInvoiceData = { serial, customerId: billCustomer, generatedDate: genDate, shipmentIds, total: selectedTotal, payment: null, previousBalance, previousBalanceRefs, carriedForward: false };
    const created = await createDoc("invoice", newInvoiceData);

    await Promise.all([
      ...shipmentIds.map((id) => patchDoc(id, { invoiced: true, invoiceSerial: serial })),
      ...outstanding.map((i) => patchDoc(i.id, { carriedForward: true })),
    ]);

    setShipments((prev) => prev.map((s) => (selectedIds[s.id] ? { ...s, invoiced: true, invoiceSerial: serial } : s)));
    setInvoices((prev) => [
      ...prev.map((i) => (previousBalanceRefs.includes(i.serial) ? { ...i, carriedForward: true } : i)),
      created,
    ]);
    setPrintBillData({ serial, customerName: senderName, rows, grandTotal: selectedTotal, previousBalance, previousBalanceRefs });
    setInvoiceSerial((n) => n + 1);
  }

  function reopenInvoice(inv) {
    const rows = shipments.filter((s) => inv.shipmentIds.includes(s.id));
    const senderName = customerById(inv.customerId)?.name || "";
    const billRows = buildBillRows(rows, senderName);
    const total = billRows.reduce((a, r) => a + r.total, 0);
    setPrintBillData({ serial: inv.serial, customerName: senderName, rows: billRows, grandTotal: total, previousBalance: inv.previousBalance, previousBalanceRefs: inv.previousBalanceRefs });
  }

  async function deleteInvoice(serial) {
    if (!window.confirm(`Delete bill #${serial}? Its shipments will go back to "not invoiced" so you can correct and re-bill them.`)) return;
    const inv = invoices.find((i) => i.serial === serial);
    const refs = inv?.previousBalanceRefs || [];
    const affectedShipmentIds = shipments.filter((s) => s.invoiceSerial === serial).map((s) => s.id);
    const releasedInvoiceIds = invoices.filter((i) => refs.includes(i.serial)).map((i) => i.id);

    if (inv) await removeDoc(inv.id);
    await Promise.all([
      ...affectedShipmentIds.map((id) => patchDoc(id, { invoiced: false, invoiceSerial: null })),
      ...releasedInvoiceIds.map((id) => patchDoc(id, { carriedForward: false })),
    ]);

    setShipments((prev) => prev.map((s) => (s.invoiceSerial === serial ? { ...s, invoiced: false, invoiceSerial: null } : s)));
    setInvoices((prev) => prev.filter((i) => i.serial !== serial).map((i) => (refs.includes(i.serial) ? { ...i, carriedForward: false } : i)));
  }

  function recordCustomerPayment(serial, payment) {
    const inv = invoices.find((i) => i.serial === serial);
    if (inv) patchDoc(inv.id, { payment });
    setInvoices((prev) => prev.map((i) => (i.serial === serial ? { ...i, payment } : i)));
  }
  function clearCustomerPayment(serial) {
    if (!window.confirm("Remove the recorded payment for this bill?")) return;
    const inv = invoices.find((i) => i.serial === serial);
    if (inv) patchDoc(inv.id, { payment: null });
    setInvoices((prev) => prev.map((i) => (i.serial === serial ? { ...i, payment: null } : i)));
  }

  // ---- record customer payment modal ----
  const [payForm, setPayForm] = useState(null); // { serial, amount, method, ref, date }
  function openPaymentModal(inv) {
    setPayForm({
      serial: inv.serial,
      amount: inv.payment?.amount ?? inv.total,
      method: inv.payment?.method || CUSTOMER_PAYMENT_METHODS[0],
      ref: inv.payment?.ref || "",
      date: inv.payment?.date || todayISO(),
    });
  }
  function savePayment() {
    if (!payForm) return;
    recordCustomerPayment(payForm.serial, {
      amount: Number(payForm.amount) || 0,
      method: payForm.method,
      ref: payForm.ref,
      date: payForm.date,
    });
    setPayForm(null);
  }
  const payInvoice = payForm ? invoices.find((i) => i.serial === payForm.serial) : null;

  // ---- settlement ----
  const [settleTransporter, setSettleTransporter] = useState(transporters[0]?.id || "");
  const settleRows = shipments.filter((s) => s.transporterId === settleTransporter);
  const settleBalance = settleRows.reduce((a, s) => a + (s.transporterRate - (s.transporterPaid || 0)), 0);

  // ---- reports ----
  const [reportType, setReportType] = useState("profit");
  const [repFrom, setRepFrom] = useState("2026-06-01");
  const [repTo, setRepTo] = useState("2026-06-30");
  const repRows = enriched.filter((s) => s.date >= repFrom && s.date <= repTo);
  const repBilling = repRows.reduce((a, s) => a + s.total, 0);
  const repTransporterCost = repRows.reduce((a, s) => a + s.transporterRate, 0);
  const repPayable = repRows.reduce((a, s) => a + (s.transporterRate - (s.transporterPaid || 0)), 0);
  const repNetProfit = repRows.reduce((a, s) => a + s.profit, 0);

  function buildReport() {
    if (reportType === "profit") {
      const rows = repRows.map((s) => [s.orderNo, fmtDMY(s.date), customerById(s.customerId)?.name || "—", pkr(s.customerRate), pkr(s.transporterRate), pkr(s.labour + s.other), pkr(s.profit)]);
      const totalProfit = repRows.reduce((a, s) => a + s.profit, 0);
      return { title: "Profit report", subtitle: `${fmtDMY(repFrom)} to ${fmtDMY(repTo)}`, columns: ["Order", "Date", "Customer", "Billed", "Transporter cost", "Labour/other", "Net profit"], rows, totals: ["", "", "", "", "", "Total", pkr(totalProfit)] };
    }
    if (reportType === "customer") {
      const byCustomer = {};
      repRows.forEach((s) => {
        const key = s.customerId;
        byCustomer[key] = byCustomer[key] || { shipments: 0, billed: 0 };
        byCustomer[key].shipments += 1;
        byCustomer[key].billed += s.total;
      });
      const rows = Object.entries(byCustomer).map(([id, v]) => [customerById(id)?.name || "—", v.shipments, pkr(v.billed)]);
      const total = Object.values(byCustomer).reduce((a, v) => a + v.billed, 0);
      return { title: "Customer-wise billing", subtitle: `${fmtDMY(repFrom)} to ${fmtDMY(repTo)}`, columns: ["Customer", "Shipments", "Billed"], rows, totals: ["Total", repRows.length, pkr(total)] };
    }
    const byTransporter = {};
    repRows.forEach((s) => {
      const key = s.transporterId;
      byTransporter[key] = byTransporter[key] || { shipments: 0, cost: 0, paid: 0 };
      byTransporter[key].shipments += 1;
      byTransporter[key].cost += s.transporterRate;
      byTransporter[key].paid += s.transporterPaid || 0;
    });
    const rows = Object.entries(byTransporter).map(([id, v]) => [transporterById(id)?.name || "—", v.shipments, pkr(v.cost), pkr(v.paid), pkr(v.cost - v.paid)]);
    const totalCost = Object.values(byTransporter).reduce((a, v) => a + v.cost, 0);
    const totalPaid = Object.values(byTransporter).reduce((a, v) => a + v.paid, 0);
    return { title: "Transporter-wise payable", subtitle: `${fmtDMY(repFrom)} to ${fmtDMY(repTo)}`, columns: ["Transporter", "Shipments", "Agreed cost", "Paid", "Balance"], rows, totals: ["Total", repRows.length, pkr(totalCost), pkr(totalPaid), pkr(totalCost - totalPaid)] };
  }

  function printCurrentReport() {
    setPrintReportData(buildReport());
  }
  function exportCurrentReportCSV() {
    const r = buildReport();
    downloadCSV(`${reportType}-report-${repFrom}-to-${repTo}.csv`, [r.columns, ...r.rows, r.totals]);
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: PAPER, color: INK, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <style>{`@keyframes agt-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 30, height: 30, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: AMBER, animation: "agt-spin 0.8s linear infinite" }} />
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, letterSpacing: 0.5 }}>Loading Azad Goods Transport…</div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: PAPER, color: RUST, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        Couldn't load data from Sanity: {loadError}. Check VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET in your .env.
      </div>
    );
  }

  if (printBillData) return <PrintBill data={printBillData} onClose={() => setPrintBillData(null)} />;
  if (printReportData) return <PrintReport data={printReportData} onClose={() => setPrintReportData(null)} />;

  return (
    <div className="app-shell" style={{ fontFamily: "'Inter', sans-serif", background: PAPER, color: INK, minHeight: "100vh", display: "flex" }}>
      <style>{FONT_IMPORT}{RESPONSIVE_CSS}</style>

      {payForm && payInvoice && (
        <PaymentModal
          invoice={payInvoice}
          customerName={customerById(payInvoice.customerId)?.name || "—"}
          form={payForm}
          setForm={setPayForm}
          onSave={savePayment}
          onClose={() => setPayForm(null)}
        />
      )}

      <div className="sidebar" style={{ width: 216, flexShrink: 0, background: INK, color: "#E9E5D8", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ padding: "0 8px 18px" }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>AZAD GOODS</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, color: AMBER, letterSpacing: 2, marginTop: 2 }}>TRANSPORT COMPANY</div>
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = view === n.key;
          return (
            <button key={n.key} onClick={() => { if (n.key !== "new") cancelEdit(); setView(n.key); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", border: "none", borderRadius: 4, background: active ? "rgba(173,122,47,0.18)" : "transparent", color: active ? "#F2D9A8" : "#C7C2B1", fontSize: 13.5, fontFamily: "'Inter', sans-serif", cursor: "pointer", textAlign: "left", borderLeft: active ? `2px solid ${AMBER}` : "2px solid transparent" }}>
              <Icon size={16} />
              {n.label}
              {n.key === "billing" && uninvoicedCount > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10.5, background: AMBER, color: INK, borderRadius: 10, padding: "1px 6px" }}>{uninvoicedCount}</span>
              )}
            </button>
          );
        })}
        {refreshing && (
          <div style={{ marginTop: refreshing ? undefined : "auto", padding: "8px 10px", fontSize: 10.5, color: "#8A8574", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER, animation: "agt-spin 1s linear infinite" }} />
            Syncing…
          </div>
        )}
        <button
          onClick={() => { logout(); window.location.replace("/"); }}
          style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", border: "none", borderRadius: 4, background: "transparent", color: "#8A8574", fontSize: 12.5, fontFamily: "'Inter', sans-serif", cursor: "pointer", textAlign: "left" }}
        >
          <LogOut size={14} /> Log out
        </button>
      </div>

      <div className="main-content" style={{ flex: 1, padding: "24px 32px", maxWidth: 1080 }}>
        {view === "dashboard" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 4px" }}>Dashboard</h1>
            <p style={{ color: "#6B6656", fontSize: 13, margin: "0 0 16px" }}>Customer &rarr; Azad Goods &rarr; Transporter, at a glance. Cost and payable figures are in the Profit report.</p>
            <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-end" }}>
              <Field label="From"><input style={inputStyle} type="date" value={dashFrom} onChange={(e) => setDashFrom(e.target.value)} /></Field>
              <Field label="To"><input style={inputStyle} type="date" value={dashTo} onChange={(e) => setDashTo(e.target.value)} /></Field>
              {(dashFrom || dashTo) && <button style={btnGhost} onClick={() => { setDashFrom(""); setDashTo(""); }}>Clear</button>}
            </div>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              <MetricCard label="Orders received" value={dashReceived} />
              <MetricCard label="Delivered" value={dashDelivered} accent={GREEN} />
              <MetricCard label="Pending" value={dashPending} accent={dashPending ? RUST : GREEN} />
            </div>
            <Card>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, marginBottom: 10 }}>Recent shipments</div>
              {dashRows.slice(-5).reverse().map((s) => (
                <div key={s.id} className="ship-row-grid" style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px 90px", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${LINE}`, fontSize: 13 }}>
                  <Stamp>{s.orderNo}</Stamp>
                  <RouteLine from={s.pickup || "?"} to={s.delivery || "?"} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: AMBER }}>{pkr(s.profit)}</span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </Card>

            <Card style={{ marginTop: 16, border: `1px dashed ${STEEL}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <FlaskConical size={15} color={STEEL} />
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14 }}>Demo / test data</div>
              </div>
              <p style={{ color: "#6B6656", fontSize: 12.5, margin: "0 0 10px", maxWidth: 560 }}>
                Load a few sample customers, transporters, shipments and one sample bill to try the app out — everything is tagged
                {" "}<Tag text="DEMO" color={STEEL} />{" "}
                on screen so it's never mixed up with real records. Remove it in one click before you start entering real shipments.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={btnGhost} disabled={demoBusy} onClick={seedDemoData}>{demoBusy ? "Working…" : "Load demo data"}</button>
                {hasDemoData && (
                  <button style={{ ...btnGhost, color: RUST, borderColor: RUST }} disabled={demoBusy} onClick={clearDemoData}>
                    <Trash2 size={13} /> {demoBusy ? "Working…" : "Remove demo data"}
                  </button>
                )}
              </div>
            </Card>
          </>
        )}

        {view === "new" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 4px" }}>{editingId ? "Edit shipment order" : "New shipment order"}</h1>
            <p style={{ color: "#6B6656", fontSize: 13, margin: "0 0 18px" }}>
              {editingId ? <>Editing <Stamp>{shipForm.orderNo}</Stamp></> : <>Order no. will be assigned as <Stamp>{nextOrderNo}</Stamp></>}
            </p>
            <Card>
              <form onSubmit={submitShipment} className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Order date">
                  <input style={inputStyle} type="date" value={shipForm.date} onChange={(e) => setShipForm({ ...shipForm, date: e.target.value })} />
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "#5B5645" }}>Customer company <span style={{ color: RUST }}>*</span></span>
                    <button type="button" onClick={() => setShowQuickCustomer((v) => !v)} style={{ ...iconBtn, fontSize: 11.5, color: STEEL }}>+ new</button>
                  </div>
                  <select style={inputStyle} value={shipForm.customerId} onChange={(e) => setShipForm({ ...shipForm, customerId: e.target.value })} required>
                    <option value="">— select customer —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {showQuickCustomer && (
                    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 4, padding: 8, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="Customer name" value={quickCustomer.name} onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })} />
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="Phone" value={quickCustomer.phone} onChange={(e) => setQuickCustomer({ ...quickCustomer, phone: e.target.value })} />
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="City" value={quickCustomer.city} onChange={(e) => setQuickCustomer({ ...quickCustomer, city: e.target.value })} />
                      <button type="button" onClick={saveQuickCustomer} style={{ ...btnGhost, justifyContent: "center" }}>Save customer</button>
                    </div>
                  )}
                </div>

                <Field label="Required truck (type)">
                  <input style={inputStyle} placeholder="10 Wheeler" value={shipForm.truckType} onChange={(e) => setShipForm({ ...shipForm, truckType: e.target.value })} />
                </Field>

                <Field label="Item">
                  <input style={inputStyle} placeholder="Bags" value={shipForm.item} onChange={(e) => setShipForm({ ...shipForm, item: e.target.value })} />
                </Field>
                <Field label="Quantity">
                  <input style={inputStyle} placeholder="100 Bags" value={shipForm.qty} onChange={(e) => setShipForm({ ...shipForm, qty: e.target.value })} />
                </Field>
                <Field label="Receiver">
                  <input style={inputStyle} placeholder="Receiver name" value={shipForm.receiver} onChange={(e) => setShipForm({ ...shipForm, receiver: e.target.value })} />
                </Field>

                <Field label="Pickup from">
                  <input style={inputStyle} placeholder="FLN" value={shipForm.pickup} onChange={(e) => setShipForm({ ...shipForm, pickup: e.target.value })} />
                </Field>
                <Field label="Delivery to">
                  <input style={inputStyle} placeholder="Karachi" value={shipForm.delivery} onChange={(e) => setShipForm({ ...shipForm, delivery: e.target.value })} />
                </Field>
                <Field label="Status">
                  <select style={inputStyle} value={shipForm.status} onChange={(e) => setShipForm({ ...shipForm, status: e.target.value })}>
                    <option>Pending</option>
                    <option>In Transit</option>
                    <option>Delivered</option>
                  </select>
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "#5B5645" }}>Transporter</span>
                    <button type="button" onClick={() => setShowQuickTransporter((v) => !v)} style={{ ...iconBtn, fontSize: 11.5, color: STEEL }}>+ new</button>
                  </div>
                  <select
                    style={inputStyle}
                    value={shipForm.transporterId}
                    onChange={(e) => {
                      const t = transporterById(e.target.value);
                      // Picking a transporter fills in its truck no. for you —
                      // no need to type the same number twice. Still editable
                      // below if this run uses a different vehicle.
                      setShipForm((f) => ({ ...f, transporterId: e.target.value, vehicleNo: t ? t.truckNo || "" : f.vehicleNo }));
                    }}
                  >
                    <option value="">— not assigned yet (order saved as Pending) —</option>
                    {transporters.map((t) => <option key={t.id} value={t.id}>{t.name} &mdash; {t.truckNo}</option>)}
                  </select>
                  {showQuickTransporter && (
                    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 4, padding: 8, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="Truck owner name" value={quickTransporter.name} onChange={(e) => setQuickTransporter({ ...quickTransporter, name: e.target.value })} />
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="Truck no." value={quickTransporter.truckNo} onChange={(e) => setQuickTransporter({ ...quickTransporter, truckNo: e.target.value })} />
                      <input style={{ ...inputStyle, padding: "5px 8px" }} placeholder="Truck type" value={quickTransporter.truckType} onChange={(e) => setQuickTransporter({ ...quickTransporter, truckType: e.target.value })} />
                      <button type="button" onClick={saveQuickTransporter} style={{ ...btnGhost, justifyContent: "center" }}>Save transporter</button>
                    </div>
                  )}
                </div>

                <Field label={shipForm.transporterId ? "Vehicle No. (from transporter, editable)" : "Vehicle No. (optional until a transporter is assigned)"}>
                  <input style={inputStyle} placeholder="e.g. JT-0194" value={shipForm.vehicleNo} onChange={(e) => setShipForm({ ...shipForm, vehicleNo: e.target.value })} />
                </Field>

                <Field label="Transporter rate (cost)">
                  <input style={inputStyle} type="number" placeholder="27000" value={shipForm.transporterRate} onChange={(e) => setShipForm({ ...shipForm, transporterRate: e.target.value })} />
                </Field>
                <Field label="Customer rate (billing)">
                  <input style={inputStyle} type="number" placeholder="28000" value={shipForm.customerRate} onChange={(e) => setShipForm({ ...shipForm, customerRate: e.target.value })} />
                </Field>

                <Field label="Labour">
                  <input style={inputStyle} type="number" placeholder="300" value={shipForm.labour} onChange={(e) => setShipForm({ ...shipForm, labour: e.target.value })} />
                </Field>
                <Field label="Other charges">
                  <input style={inputStyle} type="number" placeholder="0" value={shipForm.other} onChange={(e) => setShipForm({ ...shipForm, other: e.target.value })} />
                </Field>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 12.5, color: "#5B5645" }}>
                    Margin preview: <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: AMBER }}>{pkr((Number(shipForm.customerRate) || 0) - (Number(shipForm.transporterRate) || 0))}</span>
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1", marginTop: 4, display: "flex", gap: 10 }}>
                  <button type="submit" style={btnPrimary}><Plus size={15} /> {editingId ? "Save changes" : "Save shipment order"}</button>
                  {editingId && <button type="button" onClick={() => { cancelEdit(); setView("shipments"); }} style={btnGhost}>Cancel</button>}
                </div>
              </form>
            </Card>
          </>
        )}

        {view === "shipments" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 6px" }}>Shipments</h1>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, fontSize: 12, color: "#6B6656" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#FBEED4", border: `1px solid ${AMBER}` }} /> Invoice generated</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#E6EEE2", border: `1px solid ${GREEN}` }} /> Marked billed manually</span>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                <thead>
                  <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                    {["Order", "Date", "Customer", "Vehicle No.", "Route", "Customer rate", "Transporter", "Cost", "Transporter paid", "Margin", "Status", "Bill #", ""].map((h) => (
                      <th key={h} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((s) => {
                    const locked = !!s.invoiceSerial; // bill generated for this shipment — view only
                    const rowBg = locked ? "#FBF2E0" : s.invoiced ? "#EEF3EA" : "transparent";
                    const rowBorder = locked ? AMBER : s.invoiced ? GREEN : "transparent";
                    const relatedInvoice = locked ? invoices.find((i) => i.serial === s.invoiceSerial) : null;
                    const transporterBalance = s.transporterRate - (s.transporterPaid || 0);
                    return (
                    <tr key={s.id} style={{ borderTop: `1px solid ${LINE}`, background: rowBg, borderLeft: `3px solid ${rowBorder}` }}>
                      <td style={{ padding: "9px 10px" }}><Stamp>{s.orderNo}</Stamp>{s.isDemo && <div style={{ marginTop: 3 }}><Tag text="DEMO" color={STEEL} /></div>}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{s.date}</td>
                      <td style={{ padding: "9px 10px" }}>{customerById(s.customerId)?.name || "—"}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{s.vehicleNo || "—"}</td>
                      <td style={{ padding: "9px 10px", minWidth: 130 }}><RouteLine from={s.pickup || "?"} to={s.delivery || "?"} /></td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(s.customerRate)}</td>
                      <td style={{ padding: "9px 10px" }}>{transporterById(s.transporterId)?.name || "—"}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(s.transporterRate)}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace", color: transporterBalance > 0 ? RUST : GREEN }}>
                        {s.transporterRate ? (transporterBalance > 0 ? `${pkr(s.transporterPaid || 0)} / ${pkr(s.transporterRate)}` : "Paid") : "—"}
                      </td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace", color: AMBER }}>{pkr(s.margin)}</td>
                      <td style={{ padding: "9px 10px" }}>
                        {locked ? (
                          <StatusBadge status={s.status} />
                        ) : (
                          <select value={s.status} onChange={(e) => setStatus(s.id, e.target.value)} style={{ ...inputStyle, padding: "3px 6px", fontSize: 12 }}>
                            <option>Pending</option>
                            <option>In Transit</option>
                            <option>Delivered</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        {s.invoiceSerial ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Stamp>#{s.invoiceSerial}</Stamp>
                            {relatedInvoice && <PaymentBadge payment={relatedInvoice.payment} />}
                          </div>
                        ) : (
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#8A8574", cursor: "pointer" }}>
                            <input type="checkbox" checked={!!s.invoiced} onChange={() => toggleInvoiced(s.id)} title="Mark as billed manually (without going through Print bill)" />
                            billed?
                          </label>
                        )}
                      </td>
                      <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                        {locked ? (
                          <span title="Locked — this shipment is on a generated bill. Delete the bill to unlock and edit." style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8A8574" }}>
                            <Eye size={13} /> Locked
                          </span>
                        ) : (
                          <>
                            <button onClick={() => startEdit(s)} style={{ ...btnGhost, padding: "4px 9px", marginRight: 4 }} title="Edit this shipment"><Pencil size={13} /> Edit</button>
                            <button onClick={() => deleteShipment(s.id)} style={iconBtn} title="Delete"><Trash2 size={14} color={RUST} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table></div>
            </Card>
          </>
        )}

        {view === "customers" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 16px" }}>Customers</h1>
            <div className="split-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                  <thead>
                    <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                      {["Name", "Contact", "Phone", "City", "Terms", ""].map((h) => <th key={h} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11.5, textTransform: "uppercase" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} style={{ borderTop: `1px solid ${LINE}`, background: editingCustomerId === c.id ? "#FBF2E0" : undefined }}>
                        <td style={{ padding: "9px 10px", fontWeight: 500 }}>{c.name} {c.isDemo && <Tag text="DEMO" color={STEEL} />}</td>
                        <td style={{ padding: "9px 10px" }}>{c.contact}</td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{c.phone}</td>
                        <td style={{ padding: "9px 10px" }}>{c.city}</td>
                        <td style={{ padding: "9px 10px" }}>{c.terms}</td>
                        <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                          <button onClick={() => startEditCustomer(c)} style={iconBtn} title="Edit"><Pencil size={14} color={STEEL} /></button>
                          <button onClick={() => deleteCustomer(c.id)} style={iconBtn} title="Delete"><Trash2 size={14} color={RUST} /></button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={6} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No customers yet.</td></tr>}
                  </tbody>
                </table></div>
              </Card>
              <Card>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, marginBottom: 10 }}>{editingCustomerId ? "Edit customer" : "Add customer"}</div>
                <form onSubmit={submitCustomer} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Field label={<>Company name <span style={{ color: RUST }}>*</span></>}><input style={inputStyle} value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} required /></Field>
                  <Field label="Contact person"><input style={inputStyle} value={custForm.contact} onChange={(e) => setCustForm({ ...custForm, contact: e.target.value })} /></Field>
                  <Field label="Phone"><input style={inputStyle} value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} /></Field>
                  <Field label="City"><input style={inputStyle} value={custForm.city} onChange={(e) => setCustForm({ ...custForm, city: e.target.value })} /></Field>
                  <Field label="Address"><input style={inputStyle} value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })} /></Field>
                  <Field label="Payment terms"><input style={inputStyle} placeholder="15 days" value={custForm.terms} onChange={(e) => setCustForm({ ...custForm, terms: e.target.value })} /></Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={btnPrimary}>{editingCustomerId ? "Save changes" : "Add customer"}</button>
                    {editingCustomerId && <button type="button" onClick={cancelEditCustomer} style={btnGhost}>Cancel</button>}
                  </div>
                </form>
              </Card>
            </div>
          </>
        )}

        {view === "transporters" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 16px" }}>Transporters</h1>
            <div className="split-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                  <thead>
                    <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                      {["Owner", "Driver", "Mobile", "Truck", ""].map((h) => <th key={h} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11.5, textTransform: "uppercase" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {transporters.map((t) => (
                      <tr key={t.id} style={{ borderTop: `1px solid ${LINE}`, background: editingTransporterId === t.id ? "#FBF2E0" : undefined }}>
                        <td style={{ padding: "9px 10px", fontWeight: 500 }}>{t.name} {t.isDemo && <Tag text="DEMO" color={STEEL} />}</td>
                        <td style={{ padding: "9px 10px" }}>{t.driver}</td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{t.mobile}</td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{t.truckNo} &middot; {t.truckType}</td>
                        <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                          <button onClick={() => startEditTransporter(t)} style={iconBtn} title="Edit"><Pencil size={14} color={STEEL} /></button>
                          <button onClick={() => deleteTransporter(t.id)} style={iconBtn} title="Delete"><Trash2 size={14} color={RUST} /></button>
                        </td>
                      </tr>
                    ))}
                    {transporters.length === 0 && <tr><td colSpan={5} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No transporters yet.</td></tr>}
                  </tbody>
                </table></div>
              </Card>
              <Card>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, marginBottom: 10 }}>{editingTransporterId ? "Edit transporter" : "Add transporter"}</div>
                <form onSubmit={submitTransporter} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Field label={<>Truck owner name <span style={{ color: RUST }}>*</span></>}><input style={inputStyle} value={transForm.name} onChange={(e) => setTransForm({ ...transForm, name: e.target.value })} required /></Field>
                  <Field label="Driver name"><input style={inputStyle} value={transForm.driver} onChange={(e) => setTransForm({ ...transForm, driver: e.target.value })} /></Field>
                  <Field label="Mobile"><input style={inputStyle} value={transForm.mobile} onChange={(e) => setTransForm({ ...transForm, mobile: e.target.value })} /></Field>
                  <Field label="Truck no."><input style={inputStyle} value={transForm.truckNo} onChange={(e) => setTransForm({ ...transForm, truckNo: e.target.value })} /></Field>
                  <Field label="Truck type"><input style={inputStyle} placeholder="10 Wheeler" value={transForm.truckType} onChange={(e) => setTransForm({ ...transForm, truckType: e.target.value })} /></Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={btnPrimary}>{editingTransporterId ? "Save changes" : "Add transporter"}</button>
                    {editingTransporterId && <button type="button" onClick={cancelEditTransporter} style={btnGhost}>Cancel</button>}
                  </div>
                </form>
              </Card>
            </div>
          </>
        )}

        {view === "billing" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 6px" }}>Print bill</h1>
            <p style={{ color: "#6B6656", fontSize: 13, margin: "0 0 16px" }}>Pick a customer and period, choose which shipments to include, then print. Included shipments are marked billed and won't appear here again.</p>
            <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-end" }}>
              <Field label="Customer">
                <select style={inputStyle} value={billCustomer} onChange={(e) => setBillCustomer(e.target.value)}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="From (optional)"><input style={inputStyle} type="date" value={billFrom} onChange={(e) => setBillFrom(e.target.value)} /></Field>
              <Field label="To (optional)"><input style={inputStyle} type="date" value={billTo} onChange={(e) => setBillTo(e.target.value)} /></Field>
              <button style={{ ...btnPrimary, opacity: selectedRows.length === 0 ? 0.5 : 1 }} onClick={generateBill} disabled={selectedRows.length === 0}><Printer size={14} /> Generate &amp; print bill</button>
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                <thead>
                  <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", width: 30 }}></th>
                    {["Date", "Truck no.", "Item", "Delivery", "Received by", "Amount", "Labour", "Total"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billCandidates.map((s) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${LINE}` }}>
                      <td style={{ padding: "8px 10px" }}>
                        <input type="checkbox" checked={!!selectedIds[s.id]} onChange={() => setSelectedIds((m) => ({ ...m, [s.id]: !m[s.id] }))} />
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{s.date}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{transporterById(s.transporterId)?.truckNo || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{s.item}</td>
                      <td style={{ padding: "8px 10px" }}>{s.delivery}</td>
                      <td style={{ padding: "8px 10px" }}>{s.receiver}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(s.customerRate)}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(s.labour)}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{pkr(s.total)}</td>
                    </tr>
                  ))}
                  {billCandidates.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No unbilled shipments for this customer in this range.</td></tr>
                  )}
                </tbody>
                {billCandidates.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${INK}` }}>
                      <td colSpan={8} style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>Selected total</td>
                      <td style={{ padding: "10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: STEEL }}>{pkr(selectedTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table></div>
            </Card>
          </>
        )}

        {view === "invoices" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 6px" }}>Invoices</h1>
            <p style={{ color: "#6B6656", fontSize: 13, margin: "0 0 12px" }}>Every bill you've generated, kept serial number wise. Reopen any of them to view or print again. Deleting a bill sends its shipments back to "not invoiced" so you can correct and re-bill them.</p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, fontSize: 12, color: "#6B6656" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#E6EEE2", border: `1px solid ${GREEN}` }} /> Payment received</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#FBF2E0", border: `1px solid ${RUST}` }} /> Payment pending</span>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                <thead>
                  <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                    {["Bill #", "Customer", "Date generated", "Shipments", "Bill amount", "Prev. balance", "Total payable", "Payment", ""].map((h) => (
                      <th key={h} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...invoices].sort((a, b) => parseInt(a.serial, 10) - parseInt(b.serial, 10)).map((inv) => {
                    const totalPayable = inv.total + (inv.previousBalance || 0);
                    const rowBg = inv.payment ? "#EEF3EA" : "#FBF2E0";
                    const rowBorder = inv.payment ? GREEN : RUST;
                    return (
                    <tr key={inv.serial} style={{ borderTop: `1px solid ${LINE}`, background: rowBg, borderLeft: `3px solid ${rowBorder}`, opacity: inv.carriedForward ? 0.65 : 1 }}>
                      <td style={{ padding: "9px 10px" }}>
                        <Stamp>#{inv.serial}</Stamp>
                        {inv.isDemo && <div style={{ marginTop: 3 }}><Tag text="DEMO" color={STEEL} /></div>}
                        {inv.carriedForward && <div style={{ fontSize: 10.5, color: "#8A8574", marginTop: 3 }}>carried forward</div>}
                      </td>
                      <td style={{ padding: "9px 10px" }}>{customerById(inv.customerId)?.name || "—"}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{inv.generatedDate}</td>
                      <td style={{ padding: "9px 10px" }}>{inv.shipmentIds.length}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(inv.total)}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace", color: inv.previousBalance ? RUST : "#B4AE9C" }}>
                        {inv.previousBalance ? (
                          <>
                            {pkr(inv.previousBalance)}
                            <div style={{ fontSize: 10.5, color: "#8A8574", fontFamily: "'Inter', sans-serif" }}>b/f #{inv.previousBalanceRefs.join(", #")}</div>
                          </>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{pkr(totalPayable)}</td>
                      <td style={{ padding: "9px 10px" }}><PaymentBadge payment={inv.payment} /></td>
                      <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => reopenInvoice(inv)} style={{ ...btnGhost, padding: "4px 10px" }}><Eye size={13} /> View / print</button>
                          <button onClick={() => openPaymentModal(inv)} style={{ ...btnGhost, padding: "4px 10px" }}><Wallet size={13} /> {inv.payment ? "Edit payment" : "Record payment"}</button>
                          {inv.payment && (
                            <button onClick={() => clearCustomerPayment(inv.serial)} style={iconBtn} title="Remove recorded payment"><X size={14} color={RUST} /></button>
                          )}
                          <button onClick={() => deleteInvoice(inv.serial)} style={iconBtn} title="Delete this bill"><Trash2 size={14} color={RUST} /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No bills generated yet. Go to Print bill to create one.</td></tr>
                  )}
                </tbody>
              </table></div>
            </Card>
          </>
        )}

        {view === "settlement" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 16px" }}>Transporter settlement</h1>
            <div style={{ marginBottom: 16 }}>
              <Field label="Transporter">
                <select style={inputStyle} value={settleTransporter} onChange={(e) => setSettleTransporter(e.target.value)}>
                  {transporters.map((t) => <option key={t.id} value={t.id}>{t.name} &mdash; {t.truckNo}</option>)}
                </select>
              </Field>
            </div>
            {settleRows.length > 0 && (() => {
              const totalAgreed = settleRows.reduce((a, s) => a + (s.transporterRate || 0), 0);
              const totalPaid = settleRows.reduce((a, s) => a + (s.transporterPaid || 0), 0);
              const totalPending = totalAgreed - totalPaid;
              const paidCount = settleRows.filter((s) => (s.transporterRate || 0) > 0 && (s.transporterPaid || 0) >= (s.transporterRate || 0)).length;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                  <Card style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#8A8574", textTransform: "uppercase", letterSpacing: 0.3 }}>Total agreed cost</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, marginTop: 3 }}>{pkr(totalAgreed)}</div>
                  </Card>
                  <Card style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#8A8574", textTransform: "uppercase", letterSpacing: 0.3 }}>Paid so far</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, marginTop: 3, color: GREEN }}>{pkr(totalPaid)}</div>
                    <div style={{ fontSize: 11, color: "#8A8574", marginTop: 2 }}>{paidCount} of {settleRows.length} shipments fully paid</div>
                  </Card>
                  <Card style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#8A8574", textTransform: "uppercase", letterSpacing: 0.3 }}>Still pending</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, marginTop: 3, color: totalPending > 0 ? RUST : GREEN }}>{pkr(totalPending)}</div>
                  </Card>
                </div>
              );
            })()}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                <thead>
                  <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                    {["Date", "Truck", "Shipment", "Agreed cost", "Paid", "Method", "Reference", "Balance"].map((h) => <th key={h} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {settleRows.map((s) => {
                    const bal = s.transporterRate - (s.transporterPaid || 0);
                    return (
                      <tr key={s.id} style={{ borderTop: `1px solid ${LINE}` }}>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{s.date}</td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{transporterById(s.transporterId)?.truckNo}</td>
                        <td style={{ padding: "9px 10px" }}>{s.item} &middot; {s.orderNo}</td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{pkr(s.transporterRate)}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <input type="number" value={s.transporterPaid || 0} onChange={(e) => setPaid(s.id, e.target.value)} style={{ ...inputStyle, width: 85, padding: "4px 7px", fontFamily: "'IBM Plex Mono', monospace" }} />
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <select value={s.transporterPayMethod || ""} onChange={(e) => setTransporterPayMethod(s.id, e.target.value)} style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, width: 120 }}>
                            <option value="">—</option>
                            {TRANSPORTER_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <input value={s.transporterPayRef || ""} onChange={(e) => setTransporterPayRef(s.id, e.target.value)} placeholder="txn / cheque no." style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, width: 110 }} />
                        </td>
                        <td style={{ padding: "9px 10px", fontFamily: "'IBM Plex Mono', monospace", color: bal > 0 ? RUST : GREEN }}>{pkr(bal)}</td>
                      </tr>
                    );
                  })}
                  {settleRows.length === 0 && <tr><td colSpan={8} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No shipments for this transporter yet.</td></tr>}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${INK}` }}>
                    <td colSpan={7} style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>Total payable</td>
                    <td style={{ padding: "10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: RUST }}>{pkr(settleBalance)}</td>
                  </tr>
                </tfoot>
              </table></div>
            </Card>
          </>
        )}

        {view === "reports" && (
          <>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 16px" }}>Reports</h1>
            <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
              <Field label="Report">
                <select style={inputStyle} value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="profit">Profit report</option>
                  <option value="customer">Customer-wise billing</option>
                  <option value="transporter">Transporter-wise payable</option>
                </select>
              </Field>
              <Field label="From"><input style={inputStyle} type="date" value={repFrom} onChange={(e) => setRepFrom(e.target.value)} /></Field>
              <Field label="To"><input style={inputStyle} type="date" value={repTo} onChange={(e) => setRepTo(e.target.value)} /></Field>
              <button style={btnPrimary} onClick={printCurrentReport}><Printer size={14} /> Print report</button>
              <button style={btnGhost} onClick={exportCurrentReportCSV}><Download size={14} /> Export CSV</button>
            </div>
            {reportType === "profit" && (
              <div className="metrics-grid metrics-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                <MetricCard label="Customer billing" value={pkr(repBilling)} accent={STEEL} />
                <MetricCard label="Transporter cost" value={pkr(repTransporterCost)} />
                <MetricCard label="Transporter payable" value={pkr(repPayable)} accent={RUST} />
                <MetricCard label="Net profit" value={pkr(repNetProfit)} accent={AMBER} />
              </div>
            )}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {(() => {
                const r = buildReport();
                return (
                  <div className="table-scroll"><table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 12.8 }}>
                    <thead>
                      <tr style={{ background: "#EDE9DB", textAlign: "left" }}>
                        {r.columns.map((c) => <th key={c} style={{ padding: "9px 10px", fontWeight: 600, color: "#5B5645", fontSize: 11, textTransform: "uppercase" }}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {r.rows.map((row, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${LINE}` }}>
                          {row.map((cell, j) => <td key={j} style={{ padding: "9px 10px", fontFamily: j >= 3 ? "'IBM Plex Mono', monospace" : undefined }}>{cell}</td>)}
                        </tr>
                      ))}
                      {r.rows.length === 0 && <tr><td colSpan={r.columns.length} style={{ padding: "16px 10px", color: "#8A8574", textAlign: "center" }}>No data in this range.</td></tr>}
                    </tbody>
                    {r.rows.length > 0 && (
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${INK}` }}>
                          {r.totals.map((cell, j) => <td key={j} style={{ padding: "10px", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{cell}</td>)}
                        </tr>
                      </tfoot>
                    )}
                  </table></div>
                );
              })()}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ---- owner-only login gate ----
// The real front door is the static index.html at "/" (see that file).
// This is a second, defense-in-depth check: app.html should only ever
// be reached with a valid session already in place, but if it isn't
// (session expired, someone bookmarked /app.html directly, etc.) we
// bounce back to "/" rather than rendering anything from the app.
export default function App() {
  const [loggedIn] = useState(isLoggedIn());

  useEffect(() => {
    if (!loggedIn) {
      window.location.replace("/");
    }
  }, [loggedIn]);

  if (!loggedIn) return null;
  return <AppShell />;
}
