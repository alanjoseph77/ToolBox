"use client";
import Dropzone from "@/components/Dropzone";

/** A box to paste text, with a file picker above it that loads a text file into the box. */
export default function PasteOrFile({ value, onChange, accept, placeholder, label, rows = 10 }: { value: string; onChange: (v: string, name?: string) => void; accept: string; placeholder: string; label: string; rows?: number }) {
  return (
    <div className="space-y-3">
      <Dropzone accept={accept} onFiles={async (f) => { if (f[0]) onChange(await f[0].text(), f[0].name); }} hint="Add a file, or paste text below. It stays on your device." />
      <div><label className="label" htmlFor="paste-box">{label}</label>
        <textarea id="paste-box" className="input w-full font-mono text-xs" style={{ height: `${rows * 1.4}rem` }} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} /></div>
    </div>
  );
}
