// Saves each calculator result in FourTaps' own database (Neon, connected to
// the Vercel project under Storage), then sends a copy to the Google Sheet so
// the call list keeps filling itself. One row per visit: it appears when the
// owner sees the result, and gains their name and email if they ask for the
// written result. Anyone can post here, so every field is cut to length, a post
// that fills the hidden "website" field (a bot) is dropped, and values only ever
// reach the database as parameters, never as SQL.
import { neon } from "@neondatabase/serverless";

const SHEET = "https://script.google.com/macros/s/AKfycbyBp-081mlew3RwCED8tNva576UwG-hoEvqqVeLw_soGjfJeVX3JRWwS2K3AMm4YvD2cg/exec";
const TEXT = { visit: 40, stage: 12, calculator: 20, lead: 40, business: 120, contact: 120,
  email: 160, phone: 40, extra: 60, flags: 600, answers: 3000, src: 300 };
const NUMBERS = ["hours", "monthly", "annual", "total", "residual"];

let tableReady = false; // once per running copy of this function

export async function POST(request) {
  let d;
  try { d = JSON.parse(await request.text()); } catch { return reply(400, false); }
  if (!d || typeof d !== "object") return reply(400, false);
  if (d.website) return reply(200, true);
  const r = clean(d);
  if (!r.visit || !r.calculator) return reply(400, false);

  // Both at once; the result is kept if either one takes it.
  const [saved, copied] = await Promise.allSettled([save(r), copyToSheet(r)]);
  if (saved.status === "rejected") console.error("database:", saved.reason);
  if (copied.status === "rejected") console.error("sheet copy:", copied.reason);
  const db = saved.status === "fulfilled", sheet = copied.status === "fulfilled";
  return reply(db || sheet ? 200 : 502, db || sheet, { db, sheet });
}

function clean(d) {
  const r = {};
  for (const [k, max] of Object.entries(TEXT)) r[k] = String(d[k] ?? "").trim().slice(0, max) || null;
  for (const k of NUMBERS) {
    const n = d[k] === "" || d[k] == null ? NaN : Number(d[k]);
    r[k] = Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  }
  return r;
}

async function save(r) {
  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!tableReady) {
    await sql`CREATE TABLE IF NOT EXISTS results (
      visit text PRIMARY KEY, received timestamptz NOT NULL DEFAULT now(),
      first_seen timestamptz NOT NULL DEFAULT now(), stage text, calculator text, lead text,
      business text, contact text, email text, phone text, hours numeric, monthly numeric,
      annual numeric, total numeric, residual numeric, extra text, flags text, answers text,
      src text)`;
    tableReady = true;
  }
  // A later post from the same visit fills in what it has and keeps the rest.
  await sql`INSERT INTO results (visit, stage, calculator, lead, business, contact, email, phone,
      hours, monthly, annual, total, residual, extra, flags, answers, src)
    VALUES (${r.visit}, ${r.stage}, ${r.calculator}, ${r.lead}, ${r.business}, ${r.contact},
      ${r.email}, ${r.phone}, ${r.hours}, ${r.monthly}, ${r.annual}, ${r.total}, ${r.residual},
      ${r.extra}, ${r.flags}, ${r.answers}, ${r.src})
    ON CONFLICT (visit) DO UPDATE SET received = now(),
      stage = COALESCE(EXCLUDED.stage, results.stage),
      calculator = COALESCE(EXCLUDED.calculator, results.calculator),
      lead = COALESCE(EXCLUDED.lead, results.lead),
      business = COALESCE(EXCLUDED.business, results.business),
      contact = COALESCE(EXCLUDED.contact, results.contact),
      email = COALESCE(EXCLUDED.email, results.email),
      phone = COALESCE(EXCLUDED.phone, results.phone),
      hours = COALESCE(EXCLUDED.hours, results.hours),
      monthly = COALESCE(EXCLUDED.monthly, results.monthly),
      annual = COALESCE(EXCLUDED.annual, results.annual),
      total = COALESCE(EXCLUDED.total, results.total),
      residual = COALESCE(EXCLUDED.residual, results.residual),
      extra = COALESCE(EXCLUDED.extra, results.extra),
      flags = COALESCE(EXCLUDED.flags, results.flags),
      answers = COALESCE(EXCLUDED.answers, results.answers),
      src = COALESCE(EXCLUDED.src, results.src)`;
}

// The Google script (collect.gs) keeps its own one-row-per-visit tab.
async function copyToSheet(r) {
  const res = await fetch(SHEET, { method: "POST", body: JSON.stringify(r),
    signal: AbortSignal.timeout(10000) });
  const answer = await res.json();
  if (answer.ok !== true) throw new Error("the Sheet refused the copy");
}

// db and sheet say which of the two took the result, for checking by hand.
function reply(status, ok, where = {}) {
  return Response.json({ ok, ...where }, { status });
}
