"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ClipboardPaste } from "lucide-react";
import { pasteHelp, readClipboardFiles, registerPasteTarget } from "@/lib/paste";

/** Makes an element take pasted files (Ctrl/Cmd+V or long-press → Paste). The last one touched wins if there are several. */
export function usePasteTarget(ref: RefObject<HTMLElement | null>, onFiles: (files: File[]) => void, enabled = true) {
  const cb = useRef(onFiles);
  cb.current = onFiles;
  useEffect(() => {
    if (!enabled) return;
    const reg = registerPasteTarget(() => ref.current, (f) => cb.current(f));
    const el = ref.current, touch = () => reg.touch();
    el?.addEventListener("pointerdown", touch);
    el?.addEventListener("focusin", touch);
    return () => { reg.off(); el?.removeEventListener("pointerdown", touch); el?.removeEventListener("focusin", touch); };
  }, [ref, enabled]);
}

/** "Paste" button: reads a copied picture from the clipboard. Explains what to do when the browser does not allow it. */
export default function PasteButton({ onFiles, className = "", label = "Paste image", small }: { onFiles: (files: File[]) => void; className?: string; label?: string; small?: boolean }) {
  const [help, setHelp] = useState("");
  const [busy, setBusy] = useState(false);
  const click = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setHelp(""); setBusy(true);
    const r = await readClipboardFiles();
    setBusy(false);
    if ("files" in r) onFiles(r.files); else setHelp(pasteHelp[r.error]);
  };
  return (
    <span className="inline-flex flex-col items-center">
      <button type="button" onClick={click} disabled={busy} data-testid="paste-btn"
        className={`btn-ghost ${small ? "!min-h-[44px] !px-3 !py-1.5 text-xs" : ""} ${className}`}>
        <ClipboardPaste className="h-4 w-4" aria-hidden /> {busy ? "Pasting…" : label}
      </button>
      {help && <span role="status" className="mt-2 max-w-xs text-center text-xs text-neutral-600 dark:text-neutral-300" data-testid="paste-help" onClick={(e) => e.stopPropagation()}>{help}</span>}
    </span>
  );
}
