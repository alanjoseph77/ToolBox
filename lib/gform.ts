// Google Form generator: describe a form here, get a Google Apps Script (.gs) that builds it with FormApp.
// The person pastes the script into script.google.com and presses Run; the form is created in their own Google Drive.

export type QType = "short" | "paragraph" | "choice" | "checkbox" | "dropdown" | "scale" | "date" | "time" | "section" | "heading";
export interface Opt { text: string; correct?: boolean }
export interface Q {
  id: string; type: QType; title: string; help?: string; required?: boolean;
  options?: Opt[]; other?: boolean; points?: number;
  validate?: "" | "email" | "number" | "url";
  low?: number; high?: number; lowLabel?: string; highLabel?: string;
}
export interface FormSpec {
  title: string; description?: string;
  quiz?: boolean; collectEmail?: boolean; oneResponse?: boolean; progressBar?: boolean; shuffle?: boolean;
  confirmation?: string; sheet?: boolean;
  questions: Q[];
}

export const TYPES: { id: QType; label: string; hasOptions?: boolean }[] = [
  { id: "short", label: "Short answer" }, { id: "paragraph", label: "Paragraph" },
  { id: "choice", label: "Multiple choice", hasOptions: true }, { id: "checkbox", label: "Checkboxes", hasOptions: true }, { id: "dropdown", label: "Dropdown", hasOptions: true },
  { id: "scale", label: "Linear scale (1–5…)" }, { id: "date", label: "Date" }, { id: "time", label: "Time" },
  { id: "section", label: "New page (section)" }, { id: "heading", label: "Title and text" },
];
export const hasOptions = (t: QType) => t === "choice" || t === "checkbox" || t === "dropdown";
export const isAnswerable = (t: QType) => t !== "section" && t !== "heading";

let n = 0;
export const newId = () => `q${Date.now().toString(36)}${(n++).toString(36)}`;
export const blankQ = (type: QType = "choice"): Q => ({ id: newId(), type, title: "", required: false, ...(hasOptions(type) ? { options: [{ text: "Option 1" }, { text: "Option 2" }] } : {}), ...(type === "scale" ? { low: 1, high: 5 } : {}) });

// ---------------------------------------------------------------- reading a pasted list of questions
// 1. What is 2 + 2?          ← a question (numbered, "Q1:", or ending in "?")
// a) 3                       ← options: a) A. - • * or (1)
// b) *4                      ← a star marks the correct answer (also "(correct)" or "✓")
// 2. Your name [short]       ← [short] [paragraph] [checkbox] [dropdown] [date] [time] [scale] [required]
const LETTER_OPT = /^\s*(?:\(?[a-hA-H]\)|[a-hA-H][.:]|[ivx]{1,4}[).]|\(\d+\)|[-•●▪◦–*]|☐|\[ ?\])\s+(.*)$/;
const NUM_PAREN = /^\s*\d+\)\s+(.*)$/;                               // "1) ..." is an option unless it is a question
const QUESTION = /^\s*(?:(?:Q|Question)\s*\d+\s*[).:-]?|\d+\s*[.:-]|\d+\)(?=.*\?\s*(?:\*|\[[^\]]*\])*\s*$))\s*(.*)$/i;
const HELP = /^\s*(?:\((.+)\)|(?:note|hint|help|info)\s*[:-]\s*(.+))\s*$/i;
const CORRECT = /^\*\s*|\s*\*$|\s*\((?:correct|answer|ans|right)\)\s*$|\s*[✓✔✅]\s*$/gi;

export function parseQuestions(text: string): Q[] {
  const out: Q[] = [];
  let cur: Q | null = null;
  const push = () => { if (cur) { finish(cur); out.push(cur); } cur = null; };
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const endsQ = /\?\s*(\*|\[[^\]]*\])*\s*$/.test(line);
    const qm = QUESTION.exec(line);
    // An option: a), A., -, •, (1)… or "1)" when it is not a question itself.
    let o = cur ? LETTER_OPT.exec(line) : null;
    if (!o && cur && !endsQ) o = NUM_PAREN.exec(line);
    if (o && !(qm && endsQ)) {
      let t = o[1].trim(), correct = false;
      if (/^\*|\*$|\((?:correct|answer|ans|right)\)\s*$|[✓✔✅]\s*$/i.test(t)) { correct = true; t = t.replace(CORRECT, "").trim(); }
      if (t) (cur!.options ??= []).push({ text: t, correct });
      continue;
    }
    const ans = /^(?:answer|ans|correct(?: answer)?)\s*[:-]\s*(.+)$/i.exec(line);
    if (ans && cur?.options?.length) {                               // "Answer: b" or "Answer: New Delhi" (also "b, c")
      for (const part of ans[1].split(/\s*,\s*|\s+and\s+/)) {
        const a = part.trim().replace(/[).]$/, "");
        const exact = cur.options.find((x) => x.text.toLowerCase() === a.toLowerCase());
        const hit = exact ?? (/^[a-h]$/i.test(a) ? cur.options["abcdefgh".indexOf(a.toLowerCase())] : /^\d+$/.test(a) ? cur.options[+a - 1] : undefined);
        if (hit) hit.correct = true;
      }
      continue;
    }
    const h = cur && !cur.options?.length ? HELP.exec(line) : null;  // "(as on Aadhaar)" or "Note: …" under a question = help text
    if (h && cur) { const t = (h[1] ?? h[2]).trim(); cur.help = cur.help ? `${cur.help} ${t}` : t; continue; }
    push(); cur = { id: newId(), type: "short", title: (qm?.[1] ?? line).trim() || line, required: false };   // any other line is a question
  }
  push();
  return out;
}

function finish(q: Q) {
  const tags = [...q.title.matchAll(/\[(\w+)\]/g)].map((m) => m[1].toLowerCase());
  q.title = q.title.replace(/\s*\[\w+\]/g, "").trim();
  if (tags.includes("required") || /\*\s*$/.test(q.title)) { q.required = true; q.title = q.title.replace(/\s*\*\s*$/, ""); }
  const forced = tags.find((t) => ["short", "paragraph", "checkbox", "checkboxes", "dropdown", "date", "time", "scale", "choice"].includes(t));
  if (q.options?.length) {
    const nCorrect = q.options.filter((o) => o.correct).length;
    q.type = forced === "dropdown" ? "dropdown" : forced?.startsWith("checkbox") || nCorrect > 1 ? "checkbox" : "choice";
  } else if (forced && !["choice", "checkbox", "checkboxes", "dropdown"].includes(forced)) {
    q.type = forced as QType;
    if (q.type === "scale") { q.low = 1; q.high = 5; }
  } else if (/\b(describe|explain|comments?|feedback|suggestions?|address|why)\b/i.test(q.title)) q.type = "paragraph";
  else if (/\be-?mail\b/i.test(q.title)) { q.type = "short"; q.validate = "email"; }
  else if (/\b(date of birth|dob|which date|what date)\b/i.test(q.title)) q.type = "date";
}

// ---------------------------------------------------------------- templates
const opts = (...t: string[]): Opt[] => t.map((x) => ({ text: x.replace(/^\*/, ""), correct: x.startsWith("*") }));
const q = (type: QType, title: string, extra: Partial<Q> = {}): Q => ({ id: newId(), type, title, required: false, ...extra });

export const TEMPLATES: { id: string; name: string; make: () => FormSpec }[] = [
  { id: "quiz", name: "Class quiz", make: () => ({ title: "General Knowledge Quiz", description: "Answer all questions. Each correct answer gets 1 point.", quiz: true, collectEmail: true, questions: [
    q("short", "Your full name", { required: true }),
    q("choice", "What is the capital of India?", { required: true, points: 1, options: opts("Mumbai", "*New Delhi", "Kolkata", "Chennai") }),
    q("choice", "How many states does India have?", { required: true, points: 1, options: opts("26", "27", "*28", "29") }),
    q("checkbox", "Which of these are prime numbers?", { required: true, points: 2, options: opts("*2", "*3", "4", "*5", "6") }),
    q("dropdown", "Which planet is known as the Red Planet?", { required: true, points: 1, options: opts("Venus", "*Mars", "Jupiter") }),
  ] }) },
  { id: "event", name: "Event registration", make: () => ({ title: "Event Registration", description: "Register to attend. We will send details to your email.", collectEmail: true, sheet: true, confirmation: "Thank you for registering! See you at the event.", questions: [
    q("short", "Full name", { required: true }),
    q("short", "Phone number", { required: true, help: "10-digit mobile number" }),
    q("choice", "How many people are coming with you?", { required: true, options: opts("Just me", "2", "3", "4 or more") }),
    q("checkbox", "Which sessions will you attend?", { options: opts("Morning talk", "Workshop", "Lunch", "Evening networking") }),
    q("paragraph", "Anything we should know? (food, accessibility)"),
  ] }) },
  { id: "feedback", name: "Customer feedback", make: () => ({ title: "Customer Feedback", description: "Tell us about your visit. It takes one minute.", sheet: true, confirmation: "Thanks for your feedback!", questions: [
    q("scale", "How happy were you with your visit?", { required: true, low: 1, high: 5, lowLabel: "Not happy", highLabel: "Very happy" }),
    q("choice", "How did you hear about us?", { options: opts("Friends or family", "Instagram", "Google", "Walked past"), other: true }),
    q("checkbox", "What did you like?", { options: opts("Quality", "Price", "Service", "Cleanliness") }),
    q("paragraph", "What can we do better?"),
    q("short", "Phone (optional, for offers)"),
  ] }) },
  { id: "job", name: "Job application", make: () => ({ title: "Job Application", description: "Apply for an open role at our company.", collectEmail: true, sheet: true, progressBar: true, questions: [
    q("short", "Full name", { required: true }),
    q("short", "Phone number", { required: true, help: "10-digit mobile number" }),
    q("dropdown", "Which role are you applying for?", { required: true, options: opts("Sales executive", "Accountant", "Delivery partner", "Store manager") }),
    q("section", "Experience"),
    q("choice", "Years of experience", { required: true, options: opts("Fresher", "1–2 years", "3–5 years", "More than 5 years") }),
    q("paragraph", "Tell us about your last job"),
    q("date", "When can you start?"),
  ] }) },
];

// ---------------------------------------------------------------- the .gs script
const s = (v: string) => JSON.stringify(v ?? "");

export function problems(f: FormSpec): string[] {
  const p: string[] = [];
  if (!f.title.trim()) p.push("Add a form title.");
  if (!f.questions.length) p.push("Add at least one question.");
  f.questions.forEach((x, i) => {
    const n = `Question ${i + 1}`;
    if (!x.title.trim() && x.type !== "heading") p.push(`${n} has no text.`);
    if (hasOptions(x.type) && !(x.options ?? []).some((o) => o.text.trim())) p.push(`${n} needs at least one option.`);
    if (x.type === "scale" && !((x.low === 0 || x.low === 1) && (x.high ?? 0) >= 2 && (x.high ?? 0) <= 10)) p.push(`${n}: the scale must start at 0 or 1 and end between 2 and 10.`);
  });
  return p;
}

export function makeScript(f: FormSpec, toolUrl = "https://toolbox.otaga.in/google-form-generator"): string {
  const L: string[] = [];
  const quiz = !!f.quiz;
  L.push(`/**`, ` * Creates the Google Form "${f.title.replace(/\*\//g, "* /")}".`, ` * Made with ToolBox: ${toolUrl}`, ` *`,
    ` * How to use:`, ` *  1. Go to https://script.google.com and click "New project".`, ` *  2. Delete the sample code, paste all of this, and click Save.`,
    ` *  3. Choose "createForm" at the top and click Run.`, ` *  4. Allow access when Google asks (it is your own script, creating a form in your own Drive).`,
    ` *  5. Open "Execution log" to get the links to edit and share your form.`, ` */`, `function createForm() {`);
  L.push(`  var form = FormApp.create(${s(f.title.trim() || "Untitled form")});`);
  if (f.description?.trim()) L.push(`  form.setDescription(${s(f.description.trim())});`);
  if (quiz) L.push(`  form.setIsQuiz(true);`);
  if (f.collectEmail) L.push(`  form.setCollectEmail(true);`);
  if (f.oneResponse) L.push(`  form.setLimitOneResponsePerUser(true); // people must sign in to Google to answer`);
  if (f.progressBar) L.push(`  form.setProgressBar(true);`);
  if (f.shuffle) L.push(`  form.setShuffleQuestions(true);`);
  if (f.confirmation?.trim()) L.push(`  form.setConfirmationMessage(${s(f.confirmation.trim())});`);
  L.push(`  var item;`, ``);

  f.questions.forEach((x, i) => {
    const title = x.title.trim();
    L.push(`  // ${i + 1}. ${title.replace(/\n/g, " ").slice(0, 70) || TYPES.find((t) => t.id === x.type)?.label}`);
    const common = (v = "item") => { const c: string[] = []; if (x.help?.trim()) c.push(`  ${v}.setHelpText(${s(x.help.trim())});`); if (isAnswerable(x.type) && x.required) c.push(`  ${v}.setRequired(true);`); return c; };
    const pts = () => (quiz && isAnswerable(x.type) && (x.points ?? 0) > 0 ? [`  item.setPoints(${Math.round(x.points!)});`] : []);
    switch (x.type) {
      case "short": case "paragraph": {
        L.push(`  item = form.${x.type === "short" ? "addTextItem" : "addParagraphTextItem"}().setTitle(${s(title)});`, ...common(), ...pts());
        if (x.type === "short" && x.validate) {
          const rule = { email: "requireTextIsEmail()", number: "requireNumber()", url: "requireTextIsUrl()" }[x.validate];
          const msg = { email: "Please enter a valid email address.", number: "Please enter numbers only.", url: "Please enter a web address (link)." }[x.validate];
          L.push(`  item.setValidation(FormApp.createTextValidation().${rule}.setHelpText(${s(msg)}).build());`);
        }
        break;
      }
      case "choice": case "checkbox": case "dropdown": {
        const fn = { choice: "addMultipleChoiceItem", checkbox: "addCheckboxItem", dropdown: "addListItem" }[x.type];
        const list = (x.options ?? []).filter((o) => o.text.trim());
        L.push(`  item = form.${fn}().setTitle(${s(title)});`, ...common());
        L.push(`  item.setChoices([`, ...list.map((o, k) => `    item.createChoice(${s(o.text.trim())}${quiz ? `, ${!!o.correct}` : ""})${k < list.length - 1 ? "," : ""}`), `  ]);`);
        if (x.other && x.type !== "dropdown") L.push(`  item.showOtherOption(true);`);
        L.push(...pts());
        break;
      }
      case "scale":
        L.push(`  item = form.addScaleItem().setTitle(${s(title)}).setBounds(${x.low ?? 1}, ${x.high ?? 5});`, ...common());
        if (x.lowLabel?.trim() || x.highLabel?.trim()) L.push(`  item.setLabels(${s(x.lowLabel?.trim() ?? "")}, ${s(x.highLabel?.trim() ?? "")});`);
        L.push(...pts());
        break;
      case "date": L.push(`  item = form.addDateItem().setTitle(${s(title)});`, ...common(), ...pts()); break;
      case "time": L.push(`  item = form.addTimeItem().setTitle(${s(title)});`, ...common(), ...pts()); break;
      case "section": L.push(`  item = form.addPageBreakItem().setTitle(${s(title)});`, ...common()); break;
      case "heading": L.push(`  item = form.addSectionHeaderItem().setTitle(${s(title)});`, ...common()); break;
    }
    L.push(``);
  });

  if (f.sheet) L.push(`  // Save every response to a new Google Sheet`, `  var sheet = SpreadsheetApp.create(${s((f.title.trim() || "Form") + " (Responses)")});`, `  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());`, `  Logger.log("Responses go to: " + sheet.getUrl());`, ``);
  L.push(`  Logger.log("Edit your form: " + form.getEditUrl());`, `  Logger.log("Share this link: " + form.getPublishedUrl());`, `}`, ``);
  return L.join("\n");
}

export const fileName = (title: string) => `${(title.trim() || "google-form").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "google-form"}.gs`;
