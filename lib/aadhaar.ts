export interface Word { text: string; x0: number; y0: number; x1: number; y1: number }
export interface Box { x: number; y: number; w: number; h: number } // pixels

const digitsOnly = (s: string) => /^[^\w]*\d+[^\w]*$/.test(s) ? s.replace(/\D/g, "") : "";
const sameLine = (a: Word, b: Word) => Math.abs((a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2) < Math.max(a.y1 - a.y0, b.y1 - b.y0) * 0.6;

/**
 * Finds Aadhaar-style numbers (12 digits, usually written 1234 5678 9012) in OCR words and returns boxes
 * covering the first 8 digits. The last 4 stay readable, as on an officially "masked" Aadhaar.
 */
export function findAadhaarBoxes(words: Word[], pad = 4): Box[] {
  const boxes: Box[] = [];
  const grow = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });
  for (let i = 0; i < words.length; i++) {
    const w = words[i], d = digitsOnly(w.text);
    if (d.length === 12) { // written as one block
      const cut = w.x0 + ((w.x1 - w.x0) * 8) / 12;
      boxes.push(grow(w.x0, w.y0, cut, w.y1)); continue;
    }
    if (d.length === 4 && i + 2 < words.length) {
      const d2 = digitsOnly(words[i + 1].text), d3 = digitsOnly(words[i + 2].text);
      if (d2.length === 4 && d3.length === 4 && sameLine(w, words[i + 1]) && sameLine(w, words[i + 2])) {
        boxes.push(grow(w.x0, Math.min(w.y0, words[i + 1].y0), words[i + 1].x1, Math.max(w.y1, words[i + 1].y1)));
        i += 2; continue;
      }
    }
    if (d.length === 8 && i + 1 < words.length && digitsOnly(words[i + 1].text).length === 4 && sameLine(w, words[i + 1])) {
      boxes.push(grow(w.x0, w.y0, w.x1, w.y1)); i += 1;
    }
  }
  return boxes;
}
