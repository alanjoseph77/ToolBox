"use client";
import { useEffect, useState } from "react";
import PdfShell, { JobStatus, outName, useJob, type PdfFile } from "@/components/PdfShell";
import { download } from "@/lib/files";
import { fillForm, listFields, type FormField, type FormValues } from "@/lib/pdfForms";

function Filler({ f }: { f: PdfFile }) {
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [flatten, setFlatten] = useState(false);
  const { busy, error, run } = useJob();

  useEffect(() => {
    setFields(null);
    listFields(f.bytes).then((l) => { setFields(l); setValues(Object.fromEntries(l.map((x) => [x.name, x.value]))); }).catch(() => setFields([]));
  }, [f.id, f.bytes]);

  if (!fields) return <p className="text-sm text-neutral-500">Looking for form fields…</p>;
  if (!fields.length) return <p className="text-sm">This PDF has no fillable fields. Try <a href="/sign-pdf" className="underline">Sign PDF</a> to add a signature, or <a href="/watermark-pdf" className="underline">Add Watermark</a> to stamp text.</p>;
  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <>
      <p className="label">{fields.length} fillable field{fields.length === 1 ? "" : "s"}</p>
      <div className="space-y-3">
        {fields.map((x) => (
          <div key={x.name}>
            {x.kind === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!values[x.name]} onChange={(e) => set(x.name, e.target.checked)} /> {x.name}</label>
            ) : (
              <>
                <label className="label" htmlFor={`f-${x.name}`}>{x.name}</label>
                {x.kind === "text" ? (x.multiline
                  ? <textarea id={`f-${x.name}`} className="input h-24" value={String(values[x.name] ?? "")} onChange={(e) => set(x.name, e.target.value)} />
                  : <input id={`f-${x.name}`} className="input" value={String(values[x.name] ?? "")} onChange={(e) => set(x.name, e.target.value)} />)
                : x.kind === "radio" ? (
                  <div className="flex flex-wrap gap-3">{x.options!.map((o) => <label key={o} className="flex items-center gap-1.5 text-sm"><input type="radio" name={x.name} checked={values[x.name] === o} onChange={() => set(x.name, o)} /> {o}</label>)}</div>
                ) : (
                  <select id={`f-${x.name}`} className="input" value={String(values[x.name] ?? "")} onChange={(e) => set(x.name, e.target.value)}>
                    <option value="">—</option>{x.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} /> Lock the answers (flatten, so they can&apos;t be edited later)</label>
      <button className="btn w-full" disabled={busy} onClick={() => run(async () => download(await fillForm(f.bytes, values, flatten), outName(f.name, "-filled"), "application/pdf"))}>{busy ? "Filling…" : "Download filled PDF"}</button>
      <JobStatus busy={busy} error={error} label="Filling in your form…" />
    </>
  );
}

export default function FillPdfForm() {
  return <PdfShell hint="Works with PDFs that have fillable form fields (text boxes, tick boxes, drop-downs).">{([f]) => <Filler f={f} />}</PdfShell>;
}
