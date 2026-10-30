"use client";
import { useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { JobStatus, PartsList, useJob, type Part } from "@/components/PdfShell";
import { canvasToBlob, formatBytes, loadImage } from "@/lib/files";

interface Info { name: string; size: number; camera: string; date: string; gps: string; software: string; hasAny: boolean }
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function readInfo(file: File): Promise<Info> {
  const exifr = (await import("exifr")).default;
  let t: Record<string, unknown> = {};
  try { t = (await exifr.parse(file, { gps: true, tiff: true, exif: true, translateValues: false })) ?? {}; } catch { /* no readable metadata */ }
  const lat = t.latitude as number | undefined, lon = t.longitude as number | undefined;
  const camera = [t.Make, t.Model].filter(Boolean).join(" ");
  const date = t.DateTimeOriginal instanceof Date ? t.DateTimeOriginal.toLocaleString() : String(t.DateTimeOriginal ?? t.CreateDate ?? "");
  const gps = typeof lat === "number" && typeof lon === "number" ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "";
  const software = String(t.Software ?? "");
  return { name: file.name, size: file.size, camera, date, gps, software, hasAny: Object.keys(t).length > 0 };
}

export default function RemovePhotoDetails() {
  const [infos, setInfos] = useState<Info[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [clean, setClean] = useState<boolean | null>(null);
  const { busy, error, run } = useJob();

  const process = (files: File[]) => run(async () => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) throw new Error("Please choose photos (JPG, PNG or WebP).");
    const exifr = (await import("exifr")).default;
    const found: Info[] = [], out: Part[] = [];
    let allClean = true;
    for (const f of imgs) {
      found.push(await readInfo(f));
      // Re-drawing the pixels onto a fresh canvas drops every hidden tag (location, camera, date, software).
      const img = await loadImage(f);
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      const mime = EXT[f.type] ? f.type : "image/jpeg";
      const blob = await canvasToBlob(c, mime, 0.95);
      const left = await exifr.parse(blob, { gps: true, tiff: true, exif: true }).catch(() => null);
      if (left && Object.keys(left).length) allClean = false;
      out.push({ name: f.name.replace(/\.[^.]+$/, "") + "-clean." + EXT[mime], bytes: new Uint8Array(await blob.arrayBuffer()), type: mime });
    }
    setInfos(found); setParts(out); setClean(allClean);
  });

  return (
    <div className="space-y-4">
      <Dropzone accept="image/*" multiple onFiles={process} hint="Photos can secretly contain where and when they were taken. Remove that before sharing." />
      <JobStatus busy={busy} error={error} label="Reading and cleaning your photos…" />
      {infos.length > 0 && (
        <div className="space-y-3">
          {infos.map((i) => (
            <div key={i.name} className="space-y-1 rounded-xl border bg-white p-3 text-sm">
              <p className="font-semibold">{i.name} <span className="font-normal text-neutral-400">({formatBytes(i.size)})</span></p>
              {i.hasAny ? (
                <ul className="space-y-0.5 text-neutral-600">
                  {i.gps && <li className="flex items-center gap-1.5 font-semibold text-red-600"><MapPin className="h-4 w-4" /> Location was stored: {i.gps}</li>}
                  {i.camera && <li>Camera: {i.camera}</li>}
                  {i.date && <li>Taken: {i.date}</li>}
                  {i.software && <li>Software: {i.software}</li>}
                  {!i.gps && !i.camera && !i.date && !i.software && <li>Some hidden technical data was stored.</li>}
                </ul>
              ) : <p className="text-neutral-500">No hidden details found.</p>}
            </div>
          ))}
          {clean !== null && <p className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> {clean ? "Clean copies are ready: no hidden details remain." : "Clean copies are ready, but some data could not be confirmed as removed."}</p>}
          <PartsList parts={parts} zipName="clean-photos.zip" />
        </div>
      )}
    </div>
  );
}
