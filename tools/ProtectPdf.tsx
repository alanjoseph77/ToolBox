"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import WaterLoader from "@/components/WaterLoader";
import Dropzone from "@/components/Dropzone";
import { download } from "@/lib/files";

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [restrict, setRestrict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true); setError("");
    try {
      const doc = await PDFDocument.load(await file!.arrayBuffer(), { ignoreEncryption: true });
      await doc.encrypt({
        userPassword: pw,
        ownerPassword: pw + "-owner-" + crypto.randomUUID(),
        permissions: restrict ? { printing: false, copying: false, modifying: false, annotating: false } : { printing: "highResolution", copying: true, modifying: true, annotating: true },
      });
      download(await doc.save(), file!.name.replace(/\.pdf$/i, "") + "-protected.pdf", "application/pdf");
    } catch { setError("Could not protect this PDF. It may already be encrypted or damaged."); }
    setBusy(false);
  };

  const mismatch = pw2 !== "" && pw !== pw2;

  return (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" onFiles={(f) => setFile(f[0] ?? null)} />
      {file && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm">{file.name}</p>
          <div><label className="label">Password</label><input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
          <div><label className="label">Confirm password</label><input type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
          {mismatch && <p className="text-sm text-red-600">Passwords do not match.</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={restrict} onChange={(e) => setRestrict(e.target.checked)} /> Also block printing, copying and editing</label>
          <button className="btn w-full" disabled={!pw || pw !== pw2 || busy} onClick={run}>{busy ? "Encrypting…" : "Protect PDF"}</button>
          <WaterLoader active={busy} label="Encrypting your PDF…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-neutral-500">Keep this password safe. It can&apos;t be recovered.</p>
        </div>
      )}
    </div>
  );
}
