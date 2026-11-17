// Paste instead of save: people copy a picture (WhatsApp, a website, a screenshot) and paste it straight into a tool.
// Two ways in: the keyboard (Ctrl/Cmd+V, or long-press → Paste on phones) fires a "paste" event, and the Paste button
// reads the clipboard directly where the browser allows it.

const stamp = () => { const d = new Date(), p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/bmp": "bmp", "image/svg+xml": "svg", "image/avif": "avif" };

/** Clipboard pictures usually arrive as "image.png"; give them a clearer, unique name. */
export function nameClipboardFile(f: Blob & { name?: string }, i = 0): File {
  const generic = !f.name || /^image\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name) || f.name === "blob";
  if (!generic && f instanceof File) return f;
  const ext = EXT[f.type] ?? (f.type.split("/")[1] || "bin");
  return new File([f], `pasted-${f.type.startsWith("image/") ? "image" : "file"}-${stamp()}${i ? `-${i + 1}` : ""}.${ext}`, { type: f.type, lastModified: Date.now() });
}

/** Files carried by a paste event (copied pictures, or files copied in the file manager on a computer). */
export function filesFromPaste(e: ClipboardEvent): File[] {
  const dt = e.clipboardData;
  if (!dt) return [];
  let list = Array.from(dt.files ?? []);
  if (!list.length) list = Array.from(dt.items ?? []).filter((it) => it.kind === "file").map((it) => it.getAsFile()).filter((f): f is File => !!f);
  return list.map(nameClipboardFile);
}

export const canReadClipboard = () => typeof navigator !== "undefined" && !!navigator.clipboard && typeof navigator.clipboard.read === "function";

export type ReadResult = { files: File[] } | { error: "empty" | "text" | "denied" | "unsupported" };

/** Reads pictures from the clipboard after a tap (the browser may ask "Allow paste?"). */
export async function readClipboardFiles(): Promise<ReadResult> {
  if (!canReadClipboard()) return { error: "unsupported" };
  try {
    const items = await navigator.clipboard.read();
    const files: File[] = [];
    let sawText = false;
    for (const it of items) {
      const img = it.types.find((t) => t.startsWith("image/"));
      if (img) files.push(nameClipboardFile(await it.getType(img), files.length));
      else if (it.types.some((t) => t.startsWith("text/"))) sawText = true;
    }
    return files.length ? { files } : { error: sawText ? "text" : "empty" };
  } catch (err) {
    return { error: (err as Error)?.name === "NotAllowedError" ? "denied" : "unsupported" };
  }
}

export const pasteHelp: Record<"empty" | "text" | "denied" | "unsupported", string> = {
  empty: "Nothing to paste yet. Copy a picture first (long-press it and tap Copy image), then tap Paste.",
  text: "Your clipboard has text, not a picture. Long-press the picture and tap “Copy image”, then try again.",
  denied: "Paste was blocked. Allow clipboard access for this site, or long-press the box and tap Paste.",
  unsupported: "This browser can't paste from a button. Long-press the box and tap Paste, or press Ctrl+V on a computer.",
};

// ---- One paste target per page: if a page has two drop boxes, the paste goes to the one the user last touched,
// otherwise the first one that is visible on screen.
type Target = { el: () => HTMLElement | null; take: (files: File[]) => void; touched: number };
const targets = new Set<Target>();
let listening = false;

function onPaste(e: ClipboardEvent) {
  if (e.defaultPrevented) return;
  const files = filesFromPaste(e);
  if (!files.length) return;                         // plain text: let the text box handle it as usual
  const visible = [...targets].filter((t) => { const el = t.el(); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  if (!visible.length) return;
  const pick = visible.reduce((a, b) => (b.touched > a.touched ? b : a.touched === b.touched && compareDom(b, a) < 0 ? b : a));
  e.preventDefault();
  pick.take(files);
}
const compareDom = (a: Target, b: Target) => { const x = a.el(), y = b.el(); if (!x || !y) return 0; return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; };

/** Lets an element receive pasted files. Returns an "unregister" and a "touch" (mark as the last one used). */
export function registerPasteTarget(el: () => HTMLElement | null, take: (files: File[]) => void) {
  const t: Target = { el, take, touched: 0 };
  targets.add(t);
  if (!listening && typeof document !== "undefined") { document.addEventListener("paste", onPaste); listening = true; }
  return { off: () => { targets.delete(t); }, touch: () => { t.touched = Date.now(); } };
}
