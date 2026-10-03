/* The quoting calculator's questions and sums, in one place for the two pages
   that ask them: the quoting page (quoting/index.html) and the home page's story
   (its "Your real number" chapter). Change a question, an answer or a sum here
   and both pages follow; neither keeps its own copy. */
window.WEDGE = (function () {
  var TASKS = {
    price:     { label: "Pricing it up",            rem: .85, hint: "Looking every line up — the single biggest task in the job" },
    scope:     { label: "Reading the scope & specs", rem: .60, hint: "Drawings, quantities, what is actually being asked for" },
    prepare:   { label: "Writing the quote",        rem: .90, hint: "Filling the template, applying the margin rules" },
    intake:    { label: "Taking the request in",    rem: .80, hint: "Reading the inbox, the portal, the voicemail" },
    chase:     { label: "Sending & following up",   rem: .85, hint: "The part everyone drops when the week gets busy" },
    record:    { label: "Logging it afterwards",    rem: .90, hint: "The CRM, the spreadsheet, the job file" },
    negotiate: { label: "Negotiating & closing",    rem: .15, hint: "The relationship half — this one stays human" }
  };
  var RATE = { owner: 90, estimator: 32, sales: 38, shared: 40 };
  var RATE_HINT = {
    owner: "Owners usually value their hour at what it earns elsewhere — $75–120 is typical.",
    estimator: "Median stated estimator wage in Canadian postings is about $27/hr; $32 all-in with overhead.",
    sales: "Sales or account staff quoting between calls — $35–45/hr all-in is typical.",
    shared: "Shared across a few people — use the average of what those hours cost you."
  };
  return {
    sheet: "/api/results",
    wedge: "W2",
    /* where the answers start: the sliders where the calculator starts them, the
       rest at our guess until the visitor changes it (two of them the answers the
       calculator itself calls the most common) */
    guesses: { quotes: 10, hoursEach: 1.5, rate: 40, priceSrc: "head", intake: "mixed",
      scope: "some", turnaround: "d2", lost: "dunno", jobValue: 5000 },
    trust: [   // only what is true today; tools by name, never their logos
      "<b>Measured, not guessed:</b> job ads from 870 Canadian businesses hiring estimators, July and August 2026.",
      "<b>Works with what you use:</b> Excel, Google Sheets, Outlook, Gmail, QuickBooks and Xero. Nothing to replace."
    ],
  intro: {
    title: "What do slow quotes cost you?",
    dek: "Across 870 Canadian businesses hiring estimators, the heaviest part of the job is not writing the quote &mdash; it is <b>looking the numbers up</b>. Set your week below and watch what it costs."
  },
    questions: [
      { id: "who", type: "choice", ask: "Who puts the quotes together?",
        sets: function (v) { return { rate: RATE[v] }; },
        options: [
          { value: "owner", label: "Me", hint: "The most common answer under 20 staff" },
          { value: "estimator", label: "A dedicated estimator", chip: "An estimator" },
          { value: "sales", label: "Sales or account staff, between other things", chip: "Sales staff" },
          { value: "shared", label: "Whoever is free that day", chip: "Whoever is free" } ] },
      { id: "quotes", type: "choice", numeric: true,
        slider: { min: 1, max: 80, step: 1, start: 10,
          show: function (v) { return v + (v === 1 ? " quote" : " quotes"); } },
        ask: "How many quotes go out in a week?",
        note: "Everything that leaves with a price on it, however small.",
        options: [
          { value: 3, label: "Under 5" },
          { value: 10, label: "5 to 15" },
          { value: 22, label: "15 to 30" },
          { value: 45, label: "30 to 60" },
          { value: 80, label: "More than 60" } ] },
      { id: "hoursEach", type: "choice", numeric: true,
        slider: { min: 0.5, max: 10, step: 0.5, start: 1.5,
          show: function (v) { return v < 1 ? "30 minutes" : v + (v === 1 ? " hour" : " hours"); } },
        ask: "How long does one take, start to finish?",
        note: "From the request landing to the number going back out.",
        options: [
          { value: 0.5, label: "Under an hour", hint: "Counter or catalogue pricing" },
          { value: 1.5, label: "One to two hours" },
          { value: 3, label: "Two to four hours" },
          { value: 6, label: "Half a day" },
          { value: 10, label: "A full day or more", hint: "Plan sets, tenders, big fabrication" } ] },
      { id: "rate", type: "choice", numeric: true,
        ask: "What is that hour worth?",
        note: function (a) { return RATE_HINT[a.who] || RATE_HINT.shared; },
        options: function (a) {
          var bands = a.who === "owner"
            ? [[50, "$50 an hour"], [90, "$90 an hour", "typical for an owner"], [130, "$130 an hour"], [200, "$200 or more"]]
            : [[27, "About $27 an hour"], [RATE[a.who] || 38, "About $" + (RATE[a.who] || 38) + " an hour", "the market rate all-in"],
               [55, "About $55 an hour"], [80, "$80 or more"]];
          return bands.map(function (b) { return { value: b[0], label: b[1], hint: b[2] }; });
        } },
      { id: "priceSrc", type: "choice", ask: "When you price something, where do the numbers come from?",
        note: "This is the question that decides whether any of it works.",
        options: [
          { value: "catalogue", label: "A supplier catalogue or an internal price list", chip: "A catalogue or price list", hint: "A system can look these up directly" },
          { value: "past", label: "Past jobs, or a spreadsheet we keep", chip: "Past jobs or a spreadsheet", hint: "Extractable, with one pass of tidying" },
          { value: "rep", label: "I call the supplier rep", hint: "The price is a relationship — harder" },
          { value: "head", label: "It's in my head", hint: "Honest, and the most common answer" } ] },
      { id: "tasks", type: "multi",
        ask: "Which of these happen on every quote?",
        note: "Untick anything that isn't part of your process. Each one is removable to a different degree, so this changes the answer.",
        options: Object.keys(TASKS).map(function (k) {
          return { value: k, label: TASKS[k].label, hint: TASKS[k].hint }; }) },
      { id: "intake", type: "choice", ask: "How do the requests arrive?",
        options: [
          { value: "email", label: "Email, mostly with attachments", chip: "Email with attachments" },
          { value: "portal", label: "A bid portal or tender site", chip: "A bid portal", hint: "Structured input on a deadline — the best case" },
          { value: "drawings", label: "Drawings and plan sets" },
          { value: "mixed", label: "A mix of email and phone" },
          { value: "phone", label: "Mostly phone", hint: "Somebody still has to write it down" } ] },
      { id: "turnaround", type: "choice", ask: "How long does the customer usually wait?",
        options: [
          { value: "same", label: "Same day" },
          { value: "d2", label: "One or two days" },
          { value: "d5", label: "Three to five days" },
          { value: "week", label: "A week or more", hint: "This is where jobs quietly go elsewhere" } ] },
      { id: "lost", type: "choice", ask: "Have you lost work because the quote went out late?",
        options: [
          { value: "often", label: "Yes — regularly" },
          { value: "some", label: "Once or twice that I know of" },
          { value: "no", label: "No" },
          { value: "dunno", label: "No idea, honestly", hint: "Very common — almost nobody tracks it" } ] },
      { id: "jobValue", type: "choice", numeric: true,
        ask: "What is an average job worth to you?",
        note: "Revenue, not profit. This is what turns hours into a number worth acting on.",
        options: [
          { value: 1200, label: "Under $2,000" },
          { value: 5000, label: "$2,000 to $10,000" },
          { value: 25000, label: "$10,000 to $50,000" },
          { value: 120000, label: "$50,000 to $250,000" },
          { value: 400000, label: "More than $250,000" } ] },
      { id: "scope", type: "choice", ask: "Besides quoting, what else does that person do?",
        note: "The honest answer here is worth more than any number above it.",
        options: [
          { value: "none", label: "Nothing — quoting is the job" },
          { value: "some", label: "Some sales, some scheduling, some admin" },
          { value: "lots", label: "They run half the business — quoting is one part of the day" } ] }
    ],
    compute: function (a) {
      var quotes = Math.max(0, +a.quotes || 0);
      var each   = Math.max(0, +a.hoursEach || 0);
      var total  = quotes * each;
      var rate   = Math.max(1, +a.rate || 40);
      var price  = { catalogue: 1, past: .8, rep: .5, head: .32 }[a.priceSrc] || .6;
      var intake = { email: 1, portal: 1, drawings: .85, mixed: .72, phone: .45 }[a.intake] || .75;
      var sel = (a.tasks || []).filter(function (k) { return TASKS[k]; });
      if (!sel.length) sel = ["price"];
      var per = total / sel.length, freed = 0, bars = [];
      sel.forEach(function (k) {
        // pricing is gated by where the prices live; intake by how requests arrive
        var gate = k === "price" ? price
                 : k === "intake" ? intake
                 : k === "scope" ? (intake * .5 + .5)
                 : 1;
        var h = per * TASKS[k].rem * gate;
        freed += h; bars.push({ label: TASKS[k].label, hours: h });
      });
      bars.sort(function (x, y) { return y.hours - x.hours; });
      var annual = freed * rate * 52, residual = Math.max(0, total - freed);
      var owner = a.who === "owner";

      // revenue half — conservative, and zero where they told us lateness costs nothing
      var recov = { often: 1, some: 0.5, no: 0, dunno: 0.35 }[a.lost];
      if (recov == null) recov = 0.35;
      var slow  = { same: .4, d2: .8, d5: 1.2, week: 1.6 }[a.turnaround] || 1;
      var upside = Math.max(0, +a.jobValue || 0) * recov * slow * 12;

      var flags = [];
      if (a.priceSrc === "head" || a.priceSrc === "rep")
        flags.push({ tone: "warn", title: "Your prices do not live anywhere a system can read.",
          body: "You told us they are in your head, or on the phone with a rep. That has to come out first, and it is a project of its own — we would quote it separately rather than fold it in and hope. Anyone who tells you otherwise has not built one." });
      if (a.intake === "phone")
        flags.push({ tone: "warn", title: "Phone-only requests are the real blocker.",
          body: "Somebody still has to write down what was asked for, and that somebody is a person. We would automate the second half of the job and the seat would stay — which is not what you are paying for. An email or web-form route in front of it fixes this cheaply." });
      if (a.scope === "lots")
        flags.push({ tone: "warn", title: "Quoting is one part of that person's day.",
          body: "Taking the quoting out shrinks the job, it does not remove the seat. The hours above are still real; the salary line is not the argument to make here." });
      else if (a.scope === "some")
        flags.push({ title: "Part of this role sits outside quoting.",
          body: "The lookup work goes; the sales and scheduling do not. That usually means more quoting capacity from the same person rather than one fewer person." });
      if (a.turnaround === "week" || a.turnaround === "d5")
        flags.push({ title: "Your turnaround is where the money is, not your payroll.",
          body: "At three days and up, the fastest quote in the inbox is usually not yours. That is a revenue argument, and it is a stronger one than the hours." });

      var ptline = "";
      if (owner && freed >= 5) ptline = "Those are your evenings, not a salary line.";
      else if (!owner && residual > 0 && residual <= 12)
        ptline = "What is left is a few hours a day — usually absorbed, not hired for.";

      return {
        freed: freed, monthly: annual / 12, annual: annual, total: total, residual: residual,
        bars: bars, flags: flags, ptline: ptline,
        labels: {
          hours:   owner ? "hours a week back in your hands" : "hours a week of lookup work",
          monthly: owner ? "a month of capacity, at what your hour earns" : "a month, at your stated rate",
          annual:  owner ? "a year of earning capacity" : "a year in quoting time"
        },
        extra: upside > 0 ? {
          label: "And the other half",
          value: "$" + Math.round(upside).toLocaleString("en-CA") + " a year",
          note: "if same-day quoting recovers the work you currently lose to being late. Built from your own answers: an average job at " +
                "$" + Math.round(+a.jobValue || 0).toLocaleString("en-CA") + ", and how often you told us lateness has cost you one."
        } : {
          label: "And the other half",
          value: "Not estimated",
          note: "You told us lateness has not cost you work, so we are not going to invent a revenue figure. The hours above stand on their own."
        },
        caveat: (a.priceSrc === "head" || a.priceSrc === "rep")
          ? "How long it takes to get the pricing out of your head. That is the whole project here, and it is the one thing we cannot size from a form — it depends on how many products, how many exceptions, and how much of it only you know."
          : "Whether faster quotes actually win more work. We can measure that your quoting time is mostly lookup; we cannot measure your win rate, and most shops have never counted it. The revenue figure is a hypothesis from your own answers — worth testing, not worth banking."
      };
    },
    headline: function (r) {
      var up = r.extra && r.extra.value !== "Not estimated";
      return (up && r.annual < 40000) ? "The hours are the small half of this."
           : r.freed >= 18 ? "There is more than a full seat of lookup here."
           : r.freed >= 9  ? "There is a full part-time job in the lookup alone."
           : r.freed >= 4  ? "Modest hours — but the late ones still cost you."
                           : "Not much time. The turnaround is the thing to look at.";
    }
  };
})();
