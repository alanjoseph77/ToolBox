import { loadImage } from "./files";
import { jpegWithinKb } from "./photoSize";

const toUrl = (b: Blob) => new Promise<string>((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.onerror = () => rej(new Error("read")); f.readAsDataURL(b); });

/** A photo as a small JPEG data URL (white background), at most `kb` KB, shrinking the pixels a little at a time if needed. */
export async function compressPhoto(file: Blob, kb = 100, max = kb <= 40 ? 420 : kb <= 100 ? 900 : 1200): Promise<string> {
  const img = await loadImage(file); let k = Math.min(1, max / Math.max(img.width, img.height));
  for (let i = 0; i < 9; i++) {
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height);
    const r = await jpegWithinKb(c, kb); if (r.reached && r.quality >= 0.45) return toUrl(r.blob); k *= 0.82;
  }
  throw new Error("photo");
}
