"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { download } from "@/lib/files";

type Tab = "html" | "css" | "js";
type Files = Record<Tab, string>;
type Line = { k: string; text: string };

const KEY = "toolbox-playground-v1";
const TEMPLATES: Record<string, Files> = {
  "Hello page": {
    html: `<h1>Hello, world!</h1>\n<p>Edit the code on the left. The preview updates as you type.</p>\n<button id="btn">Click me</button>`,
    css: `body {\n  font-family: system-ui, sans-serif;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #0f172a;\n  color: #e2e8f0;\n  text-align: center;\n}\nbutton {\n  padding: 10px 20px;\n  border: 0;\n  border-radius: 10px;\n  background: #38bdf8;\n  font-size: 16px;\n  cursor: pointer;\n}`,
    js: `document.getElementById("btn").addEventListener("click", () => {\n  console.log("Button clicked at", new Date().toLocaleTimeString());\n  document.querySelector("h1").textContent = "You clicked it!";\n});`,
  },
  "Counter": {
    html: `<div class="card">\n  <h2>Counter</h2>\n  <div id="n">0</div>\n  <button id="minus">−</button>\n  <button id="plus">+</button>\n</div>`,
    css: `body { font-family: system-ui, sans-serif; background: #f1f5f9; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.card { background: white; padding: 28px 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px #0001; }\n#n { font-size: 64px; font-weight: 700; margin: 8px 0 16px; }\nbutton { width: 48px; height: 48px; font-size: 24px; border-radius: 12px; border: 1px solid #cbd5e1; background: white; cursor: pointer; margin: 0 6px; }`,
    js: `let n = 0;\nconst out = document.getElementById("n");\nconst show = () => (out.textContent = n);\ndocument.getElementById("plus").onclick = () => { n++; show(); };\ndocument.getElementById("minus").onclick = () => { n--; show(); };`,
  },
  "To-do list": {
    html: `<div class="app">\n  <h2>To-do</h2>\n  <form id="f"><input id="t" placeholder="Add a task" autocomplete="off"><button>Add</button></form>\n  <ul id="list"></ul>\n</div>`,
    css: `body { font-family: system-ui, sans-serif; background: #eef2ff; display: flex; justify-content: center; padding: 40px 16px; }\n.app { width: 100%; max-width: 380px; background: white; padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px #0001; }\nform { display: flex; gap: 8px; }\ninput { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 10px; }\nbutton { padding: 10px 14px; border: 0; border-radius: 10px; background: #4f46e5; color: white; cursor: pointer; }\nli { padding: 10px 4px; border-bottom: 1px solid #e2e8f0; cursor: pointer; list-style: none; }\nli.done { text-decoration: line-through; color: #94a3b8; }`,
    js: `const list = document.getElementById("list");\ndocument.getElementById("f").addEventListener("submit", (e) => {\n  e.preventDefault();\n  const t = document.getElementById("t");\n  if (!t.value.trim()) return;\n  const li = document.createElement("li");\n  li.textContent = t.value;\n  li.onclick = () => li.classList.toggle("done");\n  list.appendChild(li);\n  console.log("Added:", t.value);\n  t.value = "";\n});`,
  },
  "Blank": { html: "", css: "", js: "" },
};

/** Reads an uploaded .html file and spreads it over the three tabs: <style> goes to CSS, inline <script> to JS, the rest to HTML. */
export function splitHtml(src: string): Files {
  if (!/<\s*(html|head|body)[\s>]/i.test(src)) return { html: src, css: "", js: "" };
  const doc = new DOMParser().parseFromString(src, "text/html"), css: string[] = [], js: string[] = [];
  doc.querySelectorAll("style").forEach((s) => { css.push(s.textContent ?? ""); s.remove(); });
  doc.querySelectorAll("script").forEach((s) => { if (!s.src && (!s.type || /javascript|module/.test(s.type))) { js.push(s.textContent ?? ""); s.remove(); } });
  const keep = [...doc.head.children].filter((e) => !/^(TITLE|META)$/.test(e.tagName)).map((e) => e.outerHTML).join("\n");
  const body = doc.body.innerHTML.trim();
  return { html: [keep, body].filter(Boolean).join("\n\n"), css: css.join("\n\n").trim(), js: js.join("\n\n").trim() };
}

const CAPTURE = `<script>(function(){var s=function(a){return a.map(function(x){try{return typeof x==="object"?JSON.stringify(x,null,1):String(x)}catch(e){return String(x)}}).join(" ")};
["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){parent.postMessage({pg:1,k:k,t:s([].slice.call(arguments))},"*");o.apply(console,arguments)}});
addEventListener("error",function(e){parent.postMessage({pg:1,k:"error",t:e.message+(e.lineno?" (line "+e.lineno+")":"")},"*")});
addEventListener("unhandledrejection",function(e){parent.postMessage({pg:1,k:"error",t:"Unhandled promise: "+e.reason},"*")})})()<\/script>`;

export function buildDoc(f: Files, capture: boolean): string {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>My page</title>\n${capture ? CAPTURE + "\n" : ""}<style>\n${f.css}\n</style>\n</head>\n<body>\n${f.html}\n<script>\n${f.js}\n<\/script>\n</body>\n</html>`;
}

const LABEL: Record<Tab, string> = { html: "index.html", css: "style.css", js: "script.js" };
const WIDTHS: [string, string][] = [["Full", "100%"], ["Tablet", "768px"], ["Phone", "390px"]];

export default function CodePlayground() {
  const host = useRef<HTMLDivElement>(null);
  const cm = useRef<any>(null);                         // CodeMirror modules + view live outside React state
  const states = useRef<Partial<Record<Tab, any>>>({});
  const filesRef = useRef<Files>(TEMPLATES["Hello page"]);
  const frame = useRef<HTMLIFrameElement>(null);
  const [files, setFiles] = useState<Files>(TEMPLATES["Hello page"]);
  const [tab, setTab] = useState<Tab>("html");
  const [doc, setDoc] = useState("");
  const [auto, setAuto] = useState(true);
  const [width, setWidth] = useState("100%");
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const tabRef = useRef<Tab>("html");
  tabRef.current = tab;

  const docRef = useRef("");
  const [runId, setRunId] = useState(0);                   // changing it reloads the preview, which is how the Run button re-runs the same code
  const run = useCallback((f: Files, force = false) => {
    const d = buildDoc(f, true);
    if (d === docRef.current && !force) return;            // nothing changed: leave the preview and its console alone
    docRef.current = d; setLines([]); setDoc(d); if (force) setRunId((n) => n + 1);
  }, []);

  // ---- editor setup (CodeMirror 6 = the same kind of editor engine many web IDEs use) ----
  const makeState = useCallback((t: Tab, text: string) => {
    const m = cm.current;
    const lang = t === "html" ? m.html() : t === "css" ? m.css() : m.js();
    return m.EditorState.create({
      doc: text,
      extensions: [m.basicSetup, lang, m.oneDark, m.keymap.of([m.indentWithTab]), m.EditorView.lineWrapping,
        m.EditorView.updateListener.of((u: any) => { if (u.docChanged) { filesRef.current = { ...filesRef.current, [tabRef.current]: u.state.doc.toString() }; setFiles(filesRef.current); } })],
    });
  }, []);

  useEffect(() => {
    let dead = false, view: any;
    (async () => {
      const [cmod, st, vw, cmds, h, c, j, th] = await Promise.all([import("codemirror"), import("@codemirror/state"), import("@codemirror/view"), import("@codemirror/commands"), import("@codemirror/lang-html"), import("@codemirror/lang-css"), import("@codemirror/lang-javascript"), import("@codemirror/theme-one-dark")]);
      if (dead || !host.current) return;
      cm.current = { basicSetup: cmod.basicSetup, EditorView: cmod.EditorView, EditorState: st.EditorState, keymap: vw.keymap, indentWithTab: cmds.indentWithTab, html: h.html, css: c.css, js: j.javascript, oneDark: th.oneDark };
      try { const saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved?.html !== undefined) { filesRef.current = saved; setFiles(saved); } } catch { /* storage unavailable: start from the template */ }
      view = new cmod.EditorView({ state: makeState("html", filesRef.current.html), parent: host.current });
      cm.current.view = view; setReady(true); run(filesRef.current);
    })();
    return () => { dead = true; view?.destroy(); };
  }, [makeState, run]);

  const show = (t: Tab) => {                                                   // switch file tab: remember this tab's state (cursor, undo history), load the other
    const m = cm.current; if (!m?.view) return;
    states.current[tab] = m.view.state;
    m.view.setState(states.current[t] ?? makeState(t, filesRef.current[t])); setTab(t); tabRef.current = t;
  };
  const replaceAll = (f: Files) => { filesRef.current = f; setFiles(f); states.current = {}; cm.current?.view.setState(makeState(tabRef.current, f[tabRef.current])); run(f); };

  // live preview, a moment after you stop typing
  useEffect(() => { if (!ready || !auto) return; const t = setTimeout(() => run(files), 450); return () => clearTimeout(t); }, [files, auto, ready, run]);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(KEY, JSON.stringify(files)); } catch { /* ignore */ } }, [files, ready]);   // only after the saved code has been loaded
  useEffect(() => {                                                            // console output from the preview
    const on = (e: MessageEvent) => { if (e.source === frame.current?.contentWindow && e.data?.pg) setLines((l) => [...l.slice(-199), { k: e.data.k, text: e.data.t }]); };
    window.addEventListener("message", on); return () => window.removeEventListener("message", on);
  }, []);

  const open = async (list: FileList | null) => {
    const f = list?.[0]; if (!f) return; const text = await f.text(), ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "css") replaceAll({ ...filesRef.current, css: text });
    else if (ext === "js" || ext === "mjs") replaceAll({ ...filesRef.current, js: text });
    else replaceAll(splitHtml(text));
    setNote(`Opened ${f.name}`);
  };
  const full = () => buildDoc(files, false);

  return (
    <div className="space-y-3 lg:relative lg:left-1/2 lg:w-[min(1180px,94vw)] lg:-translate-x-1/2">{/* wider than the normal tool column: a code editor needs room */}
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Start from a template" className="rounded-lg border px-2 py-2 text-sm" value="" onChange={(e) => { if (e.target.value) { replaceAll(TEMPLATES[e.target.value]); setNote(`Loaded “${e.target.value}”`); } }}>
          <option value="">Templates…</option>{Object.keys(TEMPLATES).map((k) => <option key={k}>{k}</option>)}
        </select>
        <label className="btn-ghost cursor-pointer !py-1.5">Open file<input type="file" hidden accept=".html,.htm,.css,.js,.mjs,.txt" onChange={(e) => { open(e.target.files); e.target.value = ""; }} /></label>
        <button className="btn !py-1.5" onClick={() => run(files, true)}>▶ Run</button>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-run</label>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-ghost !py-1.5" onClick={() => download(new Blob([full()], { type: "text/html" }), "my-page.html")}>Download .html</button>
          <button className="btn-ghost !py-1.5" onClick={() => { navigator.clipboard?.writeText(full()).then(() => setNote("Copied the full page code")).catch(() => {}); }}>Copy code</button>
          <button className="btn-ghost !py-1.5" onClick={() => { const u = URL.createObjectURL(new Blob([full()], { type: "text/html" })); window.open(u, "_blank"); setTimeout(() => URL.revokeObjectURL(u), 60000); }}>Open in new tab</button>
        </div>
      </div>
      {note && <p className="text-xs text-neutral-500" aria-live="polite">{note}</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#282c34]">
          <div className="flex overflow-x-auto bg-[#21252b]" role="tablist">
            {(Object.keys(LABEL) as Tab[]).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => show(t)} className={`min-h-[44px] whitespace-nowrap border-b-2 px-4 text-sm ${tab === t ? "border-sky-400 bg-[#282c34] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}>{LABEL[t]}</button>
            ))}
          </div>
          <div ref={host} data-testid="editor" className="h-[55vh] min-h-[320px] overflow-auto text-[14px] [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono" />
          <div className="flex justify-between bg-[#007acc] px-3 py-1 text-xs text-white"><span>{tab.toUpperCase()}</span><span>{files[tab].split("\n").length} lines · Tab key indents</span></div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><span className="text-neutral-500">Preview</span>
            {WIDTHS.map(([l, w]) => <button key={l} className={width === w ? "btn !py-1 !min-h-0 text-xs" : "btn-ghost !py-1 !min-h-0 text-xs"} onClick={() => setWidth(w)}>{l}</button>)}</div>
          <div className="flex h-[40vh] min-h-[240px] justify-center overflow-auto rounded-xl border bg-neutral-200 p-0">
            <iframe key={runId} ref={frame} title="Preview" data-testid="preview" srcDoc={doc} sandbox="allow-scripts allow-modals allow-forms allow-popups" style={{ width, maxWidth: "100%" }} className="h-full border-0 bg-white" />
          </div>
          <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#1e1e1e] text-neutral-200">
            <div className="flex items-center justify-between bg-[#252526] px-3 py-1.5 text-xs"><span>CONSOLE</span><button className="text-neutral-400 hover:text-white" onClick={() => setLines([])}>Clear</button></div>
            <div className="h-[14vh] min-h-[90px] overflow-auto p-2 font-mono text-xs" data-testid="console">
              {lines.length === 0 && <p className="text-neutral-500">console.log() output and errors from your page show here.</p>}
              {lines.map((l, i) => <div key={i} className={l.k === "error" ? "text-red-400" : l.k === "warn" ? "text-amber-300" : ""}>{l.k === "error" ? "✖ " : "› "}{l.text}</div>)}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500">Your code runs in a sandbox inside this page and stays on your device (it is saved in this browser so you can come back). Pages that load libraries from a CDN need an internet connection.</p>
    </div>
  );
}
