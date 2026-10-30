/* eslint-disable @typescript-eslint/no-explicit-any */
// FFmpeg.wasm (single-threaded core, so no special cross-origin-isolation headers are needed).
const BASE = "/vendor/ffmpeg/";
let instance: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FFmpegWASM) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error("Could not load video engine"));
    document.head.appendChild(s);
  });
}

export function getFFmpeg(onProgress?: (p: number) => void): Promise<any> {
  instance ??= (async () => {
    await loadScript(BASE + "ffmpeg.js");
    const ff = new (window as any).FFmpegWASM.FFmpeg();
    await ff.load({
      classWorkerURL: BASE + "814.ffmpeg.js",
      coreURL: BASE + "ffmpeg-core.js",
      wasmURL: BASE + "ffmpeg-core.wasm",
    });
    return ff;
  })().catch((e) => { instance = null; throw e; });
  return instance.then((ff) => {
    ff.off("progress", (ff as any).__cb);
    if (onProgress) { (ff as any).__cb = ({ progress }: { progress: number }) => onProgress(Math.min(1, Math.max(0, progress))); ff.on("progress", (ff as any).__cb); }
    return ff;
  });
}

/** Runs ffmpeg with one input file and returns the named output as a Blob. */
export async function runFFmpeg(file: File, args: (input: string) => string[], outName: string, mime: string, onProgress?: (p: number) => void): Promise<Blob> {
  const ff = await getFFmpeg(onProgress);
  const input = "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? "");
  await ff.writeFile(input, new Uint8Array(await file.arrayBuffer()));
  const code = await ff.exec(args(input));
  if (code !== 0) throw new Error("Processing failed. This file or setting may not be supported.");
  const data = await ff.readFile(outName);
  await ff.deleteFile(input).catch(() => {});
  await ff.deleteFile(outName).catch(() => {});
  return new Blob([data as BlobPart], { type: mime });
}
