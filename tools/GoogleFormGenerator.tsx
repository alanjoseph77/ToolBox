"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ClipboardList, Copy, Download, ExternalLink, Eye, FileCode2, Plus, Trash2, X } from "lucide-react";
import { TEMPLATES, TYPES, blankQ, fileName, hasOptions, isAnswerable, makeScript, parseQuestions, problems, type FormSpec, type Q, type QType } from "@/lib/gform";
import { download } from "@/lib/files";

const LS = "toolbox:gform:v1";
const EXAMPLE = `1. What is the capital of India?
a) Mumbai
b) *New Delhi
c) Kolkata

2. Which of these are fruits?
a) *Mango
b) Carrot
c) *Banana

3. Your full name [required]
4. Your email
5. Rate the class [scale]`;

const empty = (): FormSpec => ({ title: "", description: "", questions: [blankQ("short")] });

export default function GoogleFormGenerator() {
  const [f, setF] = useState<FormSpec>(empty);
  const [loaded, setLoaded] = useState(false);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [view, setView] = useState<"script" | "preview">("script");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s?.questions) setF(s); } catch { /* nothing saved */ } setLoaded(true); }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(LS, JSON.stringify(f)); } catch { /* storage full or blocked */ } }, [f, loaded]);

  const set = (patch: Partial<FormSpec>) => setF((x) => ({ ...x, ...patch }));
  const setQ = (id: string, patch: Partial<Q>) => setF((x) => ({ ...x, questions: x.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  const move = (i: number, d: number) => setF((x) => { const qs = [...x.questions]; const j = i + d; if (j < 0 || j >= qs.length) return x; [qs[i], qs[j]] = [qs[j], qs[i]]; return { ...x, questions: qs }; });
  const remove = (id: string) => setF((x) => ({ ...x, questions: x.questions.filter((q) => q.id !== id) }));
  const add = (type: QType) => setF((x) => ({ ...x, questions: [...x.questions, blankQ(type)] }));
  const changeType = (q: Q, type: QType) => setQ(q.id, { type, ...(hasOptions(type) && !q.options?.length ? { options: [{ text: "Option 1" }, { text: "Option 2" }] } : {}), ...(type === "scale" && q.low === undefined ? { low: 1, high: 5 } : {}) });

  const issues = useMemo(() => problems(f), [f]);
  const code = useMemo(() => makeScript(f), [f]);
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 2500); };

  const applyTemplate = (id: string) => { const t = TEMPLATES.find((x) => x.id === id); if (t) { setF(t.make()); flash(`Loaded “${t.name}”. Change anything you like.`); } };
  const importPaste = (mode: "replace" | "add") => {
    const qs = parseQuestions(paste);
    if (!qs.length) { flash("No questions found. Put each question on its own line."); return; }
    const anyCorrect = qs.some((q) => q.options?.some((o) => o.correct));
    setF((x) => ({ ...x, quiz: x.quiz || anyCorrect, questions: mode === "replace" ? qs : [...x.questions.filter((q) => q.title.trim()), ...qs] }));
    setShowPaste(false); setPaste(""); flash(`Added ${qs.length} question${qs.length === 1 ? "" : "s"}${anyCorrect ? " and switched on quiz mode for the correct answers" : ""}.`);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { flash("Copy was blocked. Long-press the code and choose Select all, then Copy."); } };

  const toggle = (k: keyof FormSpec, label: string, hint?: string) => (
    <label className="flex min-h-[44px] items-start gap-3 py-1.5 text-sm">
      <input type="checkbox" className="mt-1 h-4 w-4" checked={!!f[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<FormSpec>)} data-testid={`gf-${k}`} />
      <span><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-neutral-500">{hint}</span>}</span>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Start */}
      <section className="card space-y-3 p-4 sm:p-5">
        <p className="label !mb-0">Start from</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => <button key={t.id} className="chip" onClick={() => applyTemplate(t.id)} data-testid={`gf-tpl-${t.id}`}>{t.name}</button>)}
          <button className="chip" onClick={() => { setF(empty()); flash("Started a blank form."); }}>Blank form</button>
          <button className={`chip ${showPaste ? "chip-active" : ""}`} onClick={() => setShowPaste((v) => !v)} data-testid="gf-paste-toggle"><ClipboardList className="h-4 w-4" /> Paste a list of questions</button>
        </div>
        {showPaste && (
          <div className="space-y-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Paste questions from Word, WhatsApp or notes. One question per line, options under it starting with <b>a)</b>, <b>A.</b> or <b>-</b>. Mark the right answer with <b>*</b> (or a line like <b>Answer: b</b>) to make a quiz.</p>
            <textarea className="input h-56 font-mono text-sm" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={EXAMPLE} data-testid="gf-paste" spellCheck={false} />
            <div className="flex flex-wrap gap-2">
              <button className="btn" disabled={!paste.trim()} onClick={() => importPaste("replace")} data-testid="gf-paste-go">Make questions</button>
              <button className="btn-ghost" disabled={!paste.trim()} onClick={() => importPaste("add")}>Add to my questions</button>
              <button className="btn-ghost" onClick={() => setPaste(EXAMPLE)}>Show an example</button>
            </div>
            <p className="text-xs text-neutral-500">Tags you can add after a question: [required] [paragraph] [checkbox] [dropdown] [date] [time] [scale]. A line in (brackets) under a question becomes its help text.</p>
          </div>
        )}
        {note && <p role="status" className="text-sm font-medium" data-testid="gf-note">{note}</p>}
      </section>

      {/* Settings */}
      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-bold">1. Form details</h2>
        <div><label className="label" htmlFor="gf-title">Form title</label><input id="gf-title" className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Class 8 Science Quiz" data-testid="gf-title" /></div>
        <div><label className="label" htmlFor="gf-desc">Description (optional)</label><textarea id="gf-desc" className="input h-20" value={f.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="What the form is for, and any instructions" /></div>
        <div className="grid sm:grid-cols-2 sm:gap-x-6">
          {toggle("quiz", "Make it a quiz", "Give points and mark correct answers. Google grades it for you.")}
          {toggle("sheet", "Save responses to a Google Sheet", "Creates a new sheet linked to the form.")}
          {toggle("collectEmail", "Collect email addresses")}
          {toggle("oneResponse", "Allow only one response per person", "People must sign in to Google to answer.")}
          {toggle("shuffle", "Shuffle question order")}
          {toggle("progressBar", "Show a progress bar", "Useful when the form has several pages.")}
        </div>
        <div><label className="label" htmlFor="gf-conf">Message after submitting (optional)</label><input id="gf-conf" className="input" value={f.confirmation ?? ""} onChange={(e) => set({ confirmation: e.target.value })} placeholder="Thank you! Your response has been recorded." /></div>
      </section>

      {/* Questions */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">2. Questions <span className="text-sm font-medium text-neutral-500">({f.questions.length})</span></h2>
        {f.questions.map((q, i) => (
          <div key={q.id} className="card space-y-3 p-4" data-testid="gf-q">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-black">{i + 1}</span>
              <select className="input !w-auto min-w-0 flex-1 sm:flex-none" value={q.type} onChange={(e) => changeType(q, e.target.value as QType)} aria-label={`Question ${i + 1} type`} data-testid="gf-type">
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div className="ml-auto flex gap-1">
                <button className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-900" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-900" onClick={() => move(i, 1)} disabled={i === f.questions.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => remove(q.id)} aria-label={`Delete question ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <input className="input" value={q.title} onChange={(e) => setQ(q.id, { title: e.target.value })} placeholder={q.type === "section" ? "Page title, e.g. Your experience" : q.type === "heading" ? "Heading text" : "Question"} aria-label={`Question ${i + 1}`} data-testid="gf-qtitle" />
            <input className="input text-sm" value={q.help ?? ""} onChange={(e) => setQ(q.id, { help: e.target.value })} placeholder="Help text under the question (optional)" aria-label={`Question ${i + 1} help text`} />

            {hasOptions(q.type) && (
              <div className="space-y-2">
                {(q.options ?? []).map((o, k) => (
                  <div key={k} className="flex items-center gap-2">
                    {f.quiz
                      ? <button onClick={() => setQ(q.id, { options: q.options!.map((x, j) => ({ ...x, correct: j === k ? !x.correct : q.type === "checkbox" ? x.correct : false })) })} aria-pressed={!!o.correct} aria-label={`Mark option ${k + 1} as correct`} title="Correct answer"
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${o.correct ? "border-green-600 bg-green-600 text-white" : "border-neutral-300 text-neutral-300 dark:border-neutral-700"}`}><Check className="h-4 w-4" /></button>
                      : <span className={`h-4 w-4 shrink-0 border-2 border-neutral-300 ${q.type === "checkbox" ? "rounded" : "rounded-full"} ${q.type === "dropdown" ? "hidden" : ""}`} aria-hidden />}
                    <input className="input min-w-0 flex-1" value={o.text} onChange={(e) => setQ(q.id, { options: q.options!.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)) })} aria-label={`Option ${k + 1}`} />
                    <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900" onClick={() => setQ(q.id, { options: q.options!.filter((_, j) => j !== k) })} aria-label={`Remove option ${k + 1}`}><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-ghost !py-1.5 text-sm" onClick={() => setQ(q.id, { options: [...(q.options ?? []), { text: `Option ${(q.options?.length ?? 0) + 1}` }] })}><Plus className="h-4 w-4" /> Add option</button>
                  {q.type !== "dropdown" && <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={!!q.other} onChange={(e) => setQ(q.id, { other: e.target.checked })} /> Add “Other” with a text box</label>}
                </div>
                {f.quiz && <p className="text-xs text-neutral-500">Tap ✓ next to the right answer{q.type === "checkbox" ? "s" : ""}.</p>}
              </div>
            )}

            {q.type === "short" && (
              <label className="flex flex-wrap items-center gap-2 text-sm"><span className="text-neutral-500">Answer must be</span>
                <select className="input !w-auto" value={q.validate ?? ""} onChange={(e) => setQ(q.id, { validate: e.target.value as Q["validate"] })}><option value="">anything</option><option value="email">an email</option><option value="number">a number</option><option value="url">a link (URL)</option></select></label>
            )}
            {q.type === "scale" && (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <label><span className="label">From</span><select className="input" value={q.low ?? 1} onChange={(e) => setQ(q.id, { low: +e.target.value })}><option value={0}>0</option><option value={1}>1</option></select></label>
                <label><span className="label">To</span><select className="input" value={q.high ?? 5} onChange={(e) => setQ(q.id, { high: +e.target.value })}>{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                <label><span className="label">Low label</span><input className="input" value={q.lowLabel ?? ""} onChange={(e) => setQ(q.id, { lowLabel: e.target.value })} placeholder="Poor" /></label>
                <label><span className="label">High label</span><input className="input" value={q.highLabel ?? ""} onChange={(e) => setQ(q.id, { highLabel: e.target.value })} placeholder="Excellent" /></label>
              </div>
            )}
            {isAnswerable(q.type) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={!!q.required} onChange={(e) => setQ(q.id, { required: e.target.checked })} data-testid="gf-required" /> Required</label>
                {f.quiz && <label className="flex items-center gap-2">Points <input type="number" min={0} max={100} className="input !w-20" value={q.points ?? 0} onChange={(e) => setQ(q.id, { points: Math.max(0, Math.min(100, +e.target.value || 0)) })} aria-label={`Question ${i + 1} points`} /></label>}
              </div>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => add("choice")} data-testid="gf-add"><Plus className="h-4 w-4" /> Add question</button>
          <button className="btn-ghost" onClick={() => add("short")}>+ Short answer</button>
          <button className="btn-ghost" onClick={() => add("section")}>+ New page</button>
        </div>
      </section>

      {/* Result */}
      <section className="card space-y-4 p-4 sm:p-5" data-testid="gf-result">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">3. Your Google Form script</h2>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 text-sm dark:bg-neutral-900" role="tablist">
            <button role="tab" aria-selected={view === "script"} onClick={() => setView("script")} className={`flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 font-semibold ${view === "script" ? "bg-white shadow-sm dark:bg-black" : "text-neutral-500"}`}><FileCode2 className="h-4 w-4" /> Script</button>
            <button role="tab" aria-selected={view === "preview"} onClick={() => setView("preview")} data-testid="gf-preview-tab" className={`flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 font-semibold ${view === "preview" ? "bg-white shadow-sm dark:bg-black" : "text-neutral-500"}`}><Eye className="h-4 w-4" /> Preview</button>
          </div>
        </div>

        {issues.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" data-testid="gf-issues">
            {issues.map((p) => <li key={p}>• {p}</li>)}
          </ul>
        )}

        {view === "script" ? (
          <pre className="max-h-[420px] overflow-auto rounded-xl bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100" data-testid="gf-code"><code>{code}</code></pre>
        ) : (
          <div className="space-y-3 rounded-xl bg-violet-50 p-3 dark:bg-neutral-950" data-testid="gf-preview">
            <div className="rounded-xl border-t-8 border-violet-600 bg-white p-4 dark:bg-black"><p className="text-2xl font-semibold">{f.title || "Untitled form"}</p>{f.description && <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">{f.description}</p>}{f.collectEmail && <p className="mt-3 border-t pt-2 text-xs text-neutral-500">Email *</p>}</div>
            {f.questions.map((q) => q.type === "section"
              ? <div key={q.id} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white">{q.title || "New page"}</div>
              : (
              <div key={q.id} className="rounded-xl bg-white p-4 dark:bg-black">
                <p className={q.type === "heading" ? "text-lg font-semibold" : "font-medium"}>{q.title || "Question"}{q.required && <span className="text-red-600"> *</span>}{f.quiz && (q.points ?? 0) > 0 && <span className="ml-2 text-xs text-neutral-500">{q.points} pt{q.points === 1 ? "" : "s"}</span>}</p>
                {q.help && <p className="mt-1 text-xs text-neutral-500">{q.help}</p>}
                <div className="mt-3 text-sm text-neutral-600">
                  {q.type === "short" && <div className="w-1/2 border-b border-dotted border-neutral-400 pb-1 text-neutral-400">Short answer</div>}
                  {q.type === "paragraph" && <div className="border-b border-dotted border-neutral-400 pb-1 text-neutral-400">Long answer</div>}
                  {(q.type === "choice" || q.type === "checkbox") && <ul className="space-y-2">{[...(q.options ?? []).filter((o) => o.text.trim()), ...(q.other ? [{ text: "Other: ____" }] : [])].map((o, k) => <li key={k} className="flex items-center gap-2"><span className={`h-4 w-4 border-2 border-neutral-400 ${q.type === "checkbox" ? "rounded" : "rounded-full"}`} />{o.text}{"correct" in o && o.correct && f.quiz && <Check className="h-4 w-4 text-green-600" />}</li>)}</ul>}
                  {q.type === "dropdown" && <div className="inline-flex rounded border px-3 py-1.5">Choose ▾</div>}
                  {q.type === "scale" && <div className="flex items-center gap-3 text-xs">{q.lowLabel}<span className="flex gap-2">{Array.from({ length: (q.high ?? 5) - (q.low ?? 1) + 1 }, (_, k) => <span key={k} className="flex flex-col items-center gap-1">{(q.low ?? 1) + k}<span className="h-4 w-4 rounded-full border-2 border-neutral-400" /></span>)}</span>{q.highLabel}</div>}
                  {q.type === "date" && <div className="text-neutral-400">dd/mm/yyyy</div>}
                  {q.type === "time" && <div className="text-neutral-400">--:-- </div>}
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-neutral-500">A rough preview. Google Forms draws the real form.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={copy} disabled={issues.length > 0} data-testid="gf-copy">{copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy script</>}</button>
          <button className="btn-ghost" onClick={() => download(new Blob([code], { type: "text/plain" }), fileName(f.title), "text/plain", false)} disabled={issues.length > 0} data-testid="gf-download"><Download className="h-4 w-4" /> Download .gs file</button>
          <a className="btn-ghost" href="https://script.google.com/home/projects/create" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open Google Apps Script</a>
        </div>

        <ol className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-950">
          <li><b>1.</b> Tap <b>Copy script</b>, then <b>Open Google Apps Script</b> (sign in with the Google account that should own the form).</li>
          <li><b>2.</b> Delete the sample code there, paste, and press <b>Save</b> (💾).</li>
          <li><b>3.</b> Make sure <b>createForm</b> is chosen at the top, then press <b>▶ Run</b>.</li>
          <li><b>4.</b> Google asks for permission the first time. Choose your account, then <b>Advanced → Go to project → Allow</b>. It is your own script making a form in your own Drive.</li>
          <li><b>5.</b> Open <b>Execution log</b>: it shows the link to edit your form and the link to share. The form is also in <a className="underline" href="https://docs.google.com/forms" target="_blank" rel="noopener noreferrer">Google Forms</a>.</li>
        </ol>
        <p className="text-xs text-neutral-500">Your questions are saved in this browser only, so you can come back and change them. ToolBox never sees your Google account; the form is made by Google when you run the script.</p>
      </section>
    </div>
  );
}
