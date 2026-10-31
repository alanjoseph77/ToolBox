/** Splits text into lines no wider than maxWidth; a single word wider than that stays on its own line. */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? line + " " + word : word;
      if (!line || measure(next) <= maxWidth) line = next;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines.length === 1 && lines[0] === "" ? [] : lines;
}

/** Largest font size (down to `min`) at which the wrapped text fits both the width and the height. */
export function fitFont(measureAt: (size: number) => (s: string) => number, text: string, maxWidth: number, maxHeight: number, start: number, min = 12, lineGap = 1.12) {
  for (let size = Math.round(start); size >= min; size -= 2) {
    const lines = wrapText(measureAt(size), text, maxWidth);
    if (lines.length * size * lineGap <= maxHeight && lines.every((l) => measureAt(size)(l) <= maxWidth)) return { size, lines };
  }
  return { size: min, lines: wrapText(measureAt(min), text, maxWidth) };
}
