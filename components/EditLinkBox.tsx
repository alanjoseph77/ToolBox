"use client";
import { useEffect, useState } from "react";
import { download } from "@/lib/files";

/**
 * The private edit link shown after a QR page is created. It makes saving the link easy (copy, WhatsApp, email, file, share menu),
 * says clearly whether it has been saved, and makes the browser warn before the person leaves without saving it.
 */
export default function EditLinkBox({ editUrl, pageUrl, title, saved, onSaved, prefix }: { editUrl: string; pageUrl: string; title: string; saved: boolean; onSaved: () => void; prefix: string }) {
  const [msg, setMsg] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  // until the link is saved, the browser itself asks "Leave this page?" if the person tries to close or leave
  useEffect(() => {
    if (saved) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [saved]);

  const text = `My private edit link for “${title}”. Keep it safe: anyone with it can change or delete the page.\n${editUrl}`;
  const done = (m: string) => { setMsg(m); onSaved(); setTimeout(() => setMsg(""), 4000); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(editUrl); done("Copied. Now paste it somewhere safe, like a WhatsApp chat with yourself."); }
    catch { const el = document.querySelector<HTMLInputElement>(`[data-testid=${prefix}-editlink]`); el?.select(); setMsg("Press and hold the link, choose Copy, then save it somewhere safe."); }
  };
  const file = () => {
    const body = `ToolBox private edit link\r\nKeep this file safe. Anyone who has the edit link can change or delete the page.\r\n\r\nPage: ${title}\r\nThe QR code opens: ${pageUrl}\r\nPrivate edit link: ${editUrl}\r\nSaved on: ${new Date().toLocaleString()}\r\n`;
    download(new Blob([body], { type: "text/plain" }), `toolbox-edit-link-${editUrl.match(/edit=([a-z0-9]+)/)?.[1] ?? "page"}.txt`, "text/plain", false); done("Backup file downloaded. Keep it somewhere safe.");
  };
  const btn = "btn-ghost !py-2 text-sm";

  return (
    <div className={`space-y-3 rounded-2xl border-2 p-4 text-sm ${saved ? "border-green-300 bg-green-50 text-green-900" : "border-amber-400 bg-amber-50 text-amber-950"}`} data-testid={`${prefix}-editbox`} data-saved={saved}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-bold">{saved ? "✓ Edit link saved" : "Save your private edit link"}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${saved ? "bg-green-200" : "bg-amber-200"}`} data-testid={`${prefix}-editstatus`}>{saved ? "Saved" : "Not saved yet"}</span>
      </div>
      <p>{saved ? "Keep it safe. You can use it on any phone to change or delete this page." : "Copy this link and keep it somewhere safe. It is the only way to change or delete this page from another phone, or after you clear your browser. If you lose it, you cannot edit the page. Anyone who has it can edit the page."}</p>
      <input readOnly aria-label="Private edit link" data-testid={`${prefix}-editlink`} className="input !bg-white text-xs" value={editUrl} onFocus={(e) => e.currentTarget.select()} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button className="btn col-span-2 sm:col-span-3" onClick={copy} data-testid={`${prefix}-copy-edit`}>Copy edit link</button>
        <a className={btn} target="_blank" rel="noreferrer" onClick={() => done("Opening WhatsApp. Send it to yourself.")} href={`https://wa.me/?text=${encodeURIComponent(text)}`} data-testid={`${prefix}-wa-edit`}>WhatsApp it to me</a>
        <a className={btn} onClick={() => done("Opening your email app. Send it to yourself.")} href={`mailto:?subject=${encodeURIComponent(`Edit link for ${title}`)}&body=${encodeURIComponent(text)}`} data-testid={`${prefix}-mail-edit`}>Email it to me</a>
        <button className={btn} onClick={file} data-testid={`${prefix}-file-edit`}>Download a backup file</button>
        {canShare && <button className={btn} data-testid={`${prefix}-share-edit`} onClick={() => navigator.share({ title: "Private edit link", text }).then(() => done("Shared.")).catch(() => {})}>Share or save…</button>}
      </div>
      {msg && <p className="font-semibold" aria-live="polite" data-testid={`${prefix}-editmsg`}>{msg}</p>}
      {!saved && <button className="min-h-[44px] px-1 text-xs underline opacity-80" onClick={() => { onSaved(); }} data-testid={`${prefix}-saved-already`}>I have already saved it</button>}
    </div>
  );
}
