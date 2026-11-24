// Reads a rendered QR code back with two independent decoders (ZXing, the family phones use, and jsQR) to confirm the design still scans.
// If either one can read it, the design passes: each has rare blind spots the other does not share.
import { svgToPng, type QrResult } from "./qrStyle";

export async function scansBack(r: QrResult, expected: string): Promise<boolean> {
  try { return await readsAs(await createImageBitmap(await svgToPng(r, 700)), expected, 700); } catch { return false; }
}

/** True when a picture (canvas or bitmap) reads back as `expected`, after drawing it at `width` px on white. */
export async function readsAs(src: CanvasImageSource & { width: number; height: number }, expected: string, width = 700): Promise<boolean> {
  try {
    const c = document.createElement("canvas"); c.width = width; c.height = Math.round((width * src.height) / src.width);
    const g = c.getContext("2d", { willReadFrequently: true })!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, c.width, c.height);
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    try {
      const Z = await import("@zxing/library"), lum = new Uint8ClampedArray(c.width * c.height);
      for (let i = 0; i < lum.length; i++) lum[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
      const hints = new Map<number, unknown>([[Z.DecodeHintType.TRY_HARDER, true]]);
      if (new Z.QRCodeReader().decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.RGBLuminanceSource(lum, c.width, c.height))), hints).getText() === expected) return true;
    } catch { /* not readable by ZXing: try the other decoder */ }
    const { default: jsQR } = await import("jsqr");
    return jsQR(img.data, c.width, c.height, { inversionAttempts: "attemptBoth" })?.data === expected;
  } catch { return false; }
}
