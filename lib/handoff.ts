// "Tool chaining": the result of one tool is handed to the next tool in memory,
// so the file never has to be saved and uploaded again. It works for client-side navigation.

export type Kind = "image" | "pdf" | "video";
export interface Result { blob: Blob; name: string; type: string; kind: Kind }

export function kindOf(type: string, name: string): Kind | null {
  if (type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) return "image";
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (type.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(name)) return "video";
  return null;
}

/** Which tools make sense after a result of each kind (the current tool is filtered out by the UI). */
export const nextTools: Record<Kind, string[]> = {
  image: ["image-pipeline", "compress-image", "resize-image", "image-converter", "image-cropper", "jpg-to-pdf", "remove-background", "image-upscaler", "remove-photo-details"],
  pdf: ["compress-pdf", "merge-pdf", "split-pdf", "rotate-pdf", "watermark-pdf", "add-page-numbers", "protect-pdf", "sign-pdf", "edit-pdf-details", "pdf-to-jpg"],
  video: ["video-compressor", "video-trimmer", "video-converter", "video-to-gif", "video-to-mp3"],
};

let last: Result | null = null;
let pending: { file: File; target: string; at: number } | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getLastResult = () => last;

export function publishResult(blob: Blob, name: string, type: string) {
  const kind = kindOf(type || blob.type, name);
  if (!kind) return;
  last = { blob, name, type: type || blob.type, kind };
  notify();
}

export function clearLastResult() { last = null; notify(); }

/** Called when the user picks "Continue with <tool>". The next tool picks the file up when it opens. */
export function handOff(r: Result, target: string) {
  pending = { file: new File([r.blob], r.name, { type: r.type }), target, at: Date.now() };
}

/** Does this file match an <input accept> string such as "image/*,.heic" ? */
export function matchesAccept(file: File, accept: string): boolean {
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((a) =>
    a.endsWith("/*") ? file.type.toLowerCase().startsWith(a.slice(0, -1)) : a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : file.type.toLowerCase() === a);
}

/** Used by the file picker: returns the handed-over file if it was meant for this page and fits. */
export function takePending(accept: string, pathname: string): File | null {
  if (!pending) return null;
  const p = pending;
  if (Date.now() - p.at > 30_000) { pending = null; return null; }
  if (pathname !== `/${p.target}` || !matchesAccept(p.file, accept)) return null;
  pending = null;
  return p.file;
}
