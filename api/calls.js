// Saves each request for a call, from the Book a call page, in FourTaps' own
// database (table "calls"), then sends a copy to the Google Sheet so it shows
// where the calculator results do. One row per visit: sending the form twice
// updates the same row. Anyone can post here, so every field is cut to length,
// a post that fills the hidden "website" field (a bot) is dropped, and values
// only ever reach the database as parameters, never as SQL.
import { neon } from "@neondatabase/serverless";

const SHEET = "https://script.google.com/macros/s/AKfycbyBp-081mlew3RwCED8tNva576UwG-hoEvqqVeLw_soGjfJeVX3JRWwS2K3AMm4YvD2cg/exec";
const TEXT = { visit: 40, name: 120, business: 120, email: 160, phone: 40, best_time: 200,
  about: 2000, lead: 40, src: 300 };

let tableReady = false; // once per running copy of this function

export async function POST(request) {
  let d;
  try { d = JSON.parse(await request.text()); } catch { return reply(400, false); }
  if (!d || typeof d !== "object") return reply(400, false);
  if (d.website) return reply(200, true);
  const r = {};
  for (const [k, max] of Object.entries(TEXT)) r[k] = String(d[k] ?? "").trim().slice(0, max) || null;
  if (!r.visit || !r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email || "")) return reply(400, false);

  // Both at once; the request is kept if either one takes it.
  const [saved, copied] = await Promise.allSettled([save(r), copyToSheet(r)]);
  if (saved.status === "rejected") console.error("database:", saved.reason);
  if (copied.status === "rejected") console.error("sheet copy:", copied.reason);
  const db = saved.status === "fulfilled", sheet = copied.status === "fulfilled";
  return reply(db || sheet ? 200 : 502, db || sheet, { db, sheet });
}

async function save(r) {
  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!tableReady) {
    await sql`CREATE TABLE IF NOT EXISTS calls (
      visit text PRIMARY KEY, received timestamptz NOT NULL DEFAULT now(),
      name text, business text, email text, phone text, best_time text, about text,
      lead text, src text)`;
    tableReady = true;
  }
  await sql`INSERT INTO calls (visit, name, business, email, phone, best_time, about, lead, src)
    VALUES (${r.visit}, ${r.name}, ${r.business}, ${r.email}, ${r.phone}, ${r.best_time},
      ${r.about}, ${r.lead}, ${r.src})
    ON CONFLICT (visit) DO UPDATE SET received = now(), name = EXCLUDED.name,
      business = EXCLUDED.business, email = EXCLUDED.email, phone = EXCLUDED.phone,
      best_time = EXCLUDED.best_time, about = EXCLUDED.about, lead = EXCLUDED.lead,
      src = EXCLUDED.src`;
}

// The Sheet's script (collect.gs) writes one tab, the calculator results, so a
// request goes there as a row marked "Call request". Its Lead cell is left
// empty: the call list shows each company's newest row by Lead code, and a
// request would push their calculator result out of view. The code is in the
// Answers cell instead.
async function copyToSheet(r) {
  const answers = [r.best_time && "Good time to call: " + r.best_time, r.about && "About: " + r.about,
    r.lead && "Lead code: " + r.lead].filter(Boolean).join("\n");
  const res = await fetch(SHEET, { method: "POST", signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ visit: r.visit, stage: "call", calculator: "Call request", lead: "",
      business: r.business, contact: r.name, email: r.email, phone: r.phone, answers, src: r.src }) });
  const answer = await res.json();
  if (answer.ok !== true) throw new Error("the Sheet refused the copy");
}

// db and sheet say which of the two took the request, for checking by hand.
function reply(status, ok, where = {}) {
  return Response.json({ ok, ...where }, { status });
}
