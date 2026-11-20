import { publishResult } from "./handoff";

/** Saves a file. `offerNext` (default on) shows the "continue with another tool" bar; the QR tools turn it off because it covers their buttons on a phone. */
export function download(data: Blob | Uint8Array, filename: string, type = "application/octet-stream", offerNext = true) {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type });
  if (offerNext) publishResult(blob, filename, type === "application/octet-stream" ? blob.type : type); // offers "continue with…" tools
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);   // phone browsers ignore a link that is not on the page
  a.click();
  setTimeout(() => a.remove(), 0);
  // A phone reads a downloaded file slowly and in pieces. Taking the address away after one second made big files
  // fail without any message, so it stays for a while (longer for big files).
  setTimeout(() => URL.revokeObjectURL(url), blob.size > 10 * 1024 * 1024 ? 10 * 60_000 : 60_000);
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;

export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), type, quality)
  );
}
