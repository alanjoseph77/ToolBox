"use client";
import { useRef, useState } from "react";
import { compressPhoto } from "@/lib/photoData";
import type { Data, Field } from "@/lib/qrTypes";

type V = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const blank = (fields: Field[]): V => Object.fromEntries(fields.map((f) => [f.key, f.kind === "list" || f.kind === "images" ? [] : (f.kind === "select" ? f.options?.[0]?.[0] ?? "" : "")]));

function ImageInput({ f, value, onChange, onError }: { f: Field; value: string; onChange: (v: string) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-20 w-20 rounded-xl border object-cover" /> : <button type="button" className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-xs text-neutral-500" onClick={() => ref.current?.click()}><span className="text-xl">＋</span>Add</button>}
      <div className="flex gap-2">{value && <><button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => ref.current?.click()}>Change</button><button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => onChange("")}>Remove</button></>}</div>
      <input ref={ref} type="file" accept="image/*" hidden data-testid={`qf-${f.key}-input`} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { onChange(await compressPhoto(file, f.kb ?? 100)); } catch { onError("Could not use that picture. Try another one."); } }} />
    </div>
  );
}

function Images({ f, value, onChange, onError }: { f: Field; value: string[]; onChange: (v: string[]) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null), max = f.maxItems ?? 5;
  return (
    <div className="flex flex-wrap gap-3">
      {value.map((src, i) => <div key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={`Picture ${i + 1}`} className="h-24 w-24 rounded-xl border object-cover" /><button type="button" aria-label={`Remove picture ${i + 1}`} className="absolute -right-2 -top-2 h-7 w-7 rounded-full border bg-white text-sm shadow" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button></div>)}
      {value.length < max && <button type="button" className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-sm text-neutral-500" onClick={() => ref.current?.click()}><span className="text-2xl">＋</span>Add</button>}
      <input ref={ref} type="file" accept="image/*" multiple hidden data-testid={`qf-${f.key}-input`} onChange={async (e) => {
        const files = Array.from(e.target.files ?? []).slice(0, max - value.length); e.target.value = ""; const out = [...value];
        for (const file of files) { try { out.push(await compressPhoto(file, f.kb ?? 100)); } catch { onError("One picture could not be used."); } } onChange(out);
      }} />
    </div>
  );
}

function FieldInput({ f, value, onChange, onError, id }: { f: Field; value: unknown; onChange: (v: unknown) => void; onError: (m: string) => void; id: string }) {
  const common = { id, "data-testid": `qf-${f.key}`, className: "input", placeholder: f.placeholder, maxLength: f.max } as const;
  switch (f.kind) {
    case "textarea": return <textarea {...common} className="input h-24" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "select": return <select id={id} data-testid={`qf-${f.key}`} className="input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
    case "date": return <input {...common} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "datetime": return <input {...common} type="datetime-local" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "tel": return <input {...common} type="tel" inputMode="tel" placeholder={f.placeholder ?? "+91 98765 43210"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "email": return <input {...common} type="email" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "url": return <input {...common} type="url" inputMode="url" autoCapitalize="none" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "handle": return <input {...common} placeholder={f.placeholder ?? "@yourname or full link"} autoCapitalize="none" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "image": return <ImageInput f={f} value={String(value ?? "")} onChange={onChange} onError={onError} />;
    case "images": return <Images f={f} value={(value as string[]) ?? []} onChange={onChange} onError={onError} />;
    case "list": return <ListInput f={f} value={(value as V[]) ?? []} onChange={onChange} onError={onError} id={id} />;
    default: return <input {...common} type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

function ListInput({ f, value, onChange, onError, id }: { f: Field; value: V[]; onChange: (v: V[]) => void; onError: (m: string) => void; id: string }) {
  const max = f.maxItems ?? 10, subs = f.of ?? [];
  const setRow = (i: number, k: string, v: unknown) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-3" data-testid={`qf-${f.key}`}>
      {value.map((row, i) => (
        <div key={i} className="space-y-2 rounded-xl border bg-neutral-50 p-3">
          <div className="grid gap-2 sm:grid-cols-2">{subs.map((sf, k) => (sf.kind === "list" ? null : (
            <div key={sf.key} className={subs.length === 1 ? "sm:col-span-2" : ""}><label className="label" htmlFor={`${id}-${i}-${sf.key}`}>{sf.label}</label><FieldInput f={sf} value={row[sf.key]} onChange={(v) => setRow(i, sf.key, v)} onError={onError} id={`${id}-${i}-${sf.key}`} /></div>)))}</div>
          {subs.filter((sf) => sf.kind === "list").map((sf) => <div key={sf.key}><p className="label">{sf.label}</p><ListInput f={sf} value={(row[sf.key] as V[]) ?? []} onChange={(v) => setRow(i, sf.key, v)} onError={onError} id={`${id}-${i}-${sf.key}`} /></div>)}
          <button type="button" className="text-sm text-red-700 underline" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      {value.length < max && <button type="button" className="btn-ghost !py-1.5 text-sm" data-testid={`qf-${f.key}-add`} onClick={() => onChange([...value, blank(subs)])}>+ Add {f.of && f.of.length === 1 ? f.of[0].label.toLowerCase() : "another"}</button>}
    </div>
  );
}

/** A form made from a list of field definitions. */
export default function QrForm({ fields, data, onChange, onError }: { fields: Field[]; data: Data; onChange: (d: Data) => void; onError: (m: string) => void }) {
  const [, force] = useState(0); void force;
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="label" htmlFor={`qf-${f.key}`}>{f.label}{f.required ? " *" : ""}</label>
          <FieldInput f={f} value={data[f.key]} onChange={(v) => onChange({ ...data, [f.key]: v })} onError={onError} id={`qf-${f.key}`} />
          {f.hint && <p className="mt-1 text-xs text-neutral-500">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}
export { blank };
