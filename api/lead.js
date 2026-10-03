// Looks up one company's page by its lead code: the words and starting numbers
// Mostafa approved in the "Site ..." columns of the Call list in the Google
// Sheet, how long its job ad has been open, and its kind of business (for the
// first slide's photo), read through its script
// (collect.gs). Only a well-formed code is asked
// for, and only those few fields come back, checked and cut to length; a code
// that matches nothing gets nothing. Answers are kept for a minute at Vercel's
// edge, so a change in the Sheet shows within a minute.
const SHEET = "https://script.google.com/macros/s/AKfycbyBp-081mlew3RwCED8tNva576UwG-hoEvqqVeLw_soGjfJeVX3JRWwS2K3AMm4YvD2cg/exec";
const CODE = /^[a-hjkmnp-z][a-hjkmnp-z2-9]{7}$/;   // as lead-code.py makes them
const KINDS = ["desk", "electrical", "construction", "warehouse", "trucking", "factory", "metal", "mechanical"];   // web/img/hero-<kind>.jpg

export async function GET(request) {
  const code = (new URL(request.url).searchParams.get("code") || "").toLowerCase();
  if (!CODE.test(code)) return reply({ ok: false }, 400);
  let d;
  try {
    const res = await fetch(SHEET + "?lead=" + code, { signal: AbortSignal.timeout(8000) });
    d = await res.json();
  } catch (e) {
    console.error("sheet:", e);
    return reply({ ok: false }, 502);
  }
  if (!d || d.ok !== true) return reply({ ok: false }, 404, 60);
  const text = (v, max) => String(v ?? "").trim().slice(0, max);
  const within = (v, lo, hi) => { const x = Number(v); return Number.isFinite(x) && x >= lo && x <= hi ? x : null; };
  const out = { ok: true };
  if (text(d.name, 60)) out.name = text(d.name, 60);
  if (text(d.line, 160)) out.line = text(d.line, 160);
  if (text(d.desk, 20)) out.desk = text(d.desk, 20);
  if (KINDS.includes(d.kind)) out.photo = d.kind;   // the kind of business, for the first slide's photo
  const q = within(d.q, 1, 80), h = within(d.h, 0.5, 10), r = within(d.r, 20, 200);
  if (q !== null) out.q = Math.round(q);
  if (h !== null) out.h = Math.round(h * 2) / 2;
  if (r !== null) out.r = Math.round(r);
  // how long their job ad has been open, only while it is still up: a fact
  // about the company, never a guess
  const age = within(d.age, 0, 120), status = text(d.adStatus, 40).toLowerCase();
  if (age !== null && /^(new ad|still up)/.test(status) && text(d.hiring, 60)) {
    out.adAge = Math.round(age); out.hiring = text(d.hiring, 60);
  }
  return reply(out, 200, 60);
}

function reply(body, status, keep) {
  const headers = keep ? { "Cache-Control": `public, s-maxage=${keep}, stale-while-revalidate=300` } : {};
  return Response.json(body, { status, headers });
}
