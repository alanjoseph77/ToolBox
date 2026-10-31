import type { TextItem } from "./pdfjs";
import { toLines } from "./pdfjs";

interface Line { text: string; size: number; y: number; page: number }

const BULLET = /^[•◦▪▫●○■□\-–*·]\s+/;
const NUMBERED = /^(\d{1,3})[.)]\s+/;

/** Rebuilds readable Markdown from the positioned text of a PDF: headings by font size, lists, paragraphs. */
export function pagesToMarkdown(pages: TextItem[][]): string {
  const lines: Line[] = [];
  pages.forEach((items, page) => {
    toLines(items).forEach((l) => {
      const text = l.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
      if (text) lines.push({ text, size: Math.max(...l.map((i) => i.h)), y: l[0].y, page });
    });
  });
  if (!lines.length) return "";

  // Body size = the font size that carries the most characters.
  const weight = new Map<number, number>();
  for (const l of lines) { const k = Math.round(l.size * 2) / 2; weight.set(k, (weight.get(k) ?? 0) + l.text.length); }
  const body = [...weight.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Page numbers: a bare number on the first or last line of a page.
  const lastOfPage = new Map<number, number>();
  lines.forEach((l, i) => lastOfPage.set(l.page, i));
  const drop = (l: Line, i: number) => /^\d{1,4}$/.test(l.text) && (i === lastOfPage.get(l.page) || (i === 0 || lines[i - 1].page !== l.page));

  const out: string[] = [];
  let para: string[] = [], prev: Line | null = null;
  const flush = () => { if (para.length) out.push(para.join(" ")); para = []; };

  lines.forEach((l, i) => {
    if (drop(l, i)) return;
    const ratio = l.size / body;
    const heading = l.text.length <= 120 && ratio >= 1.15 && !BULLET.test(l.text);
    if (heading) {
      flush();
      out.push(`${ratio >= 1.6 ? "#" : ratio >= 1.3 ? "##" : "###"} ${l.text}`);
    } else if (BULLET.test(l.text)) {
      flush(); out.push(`- ${l.text.replace(BULLET, "")}`);
    } else if (NUMBERED.test(l.text)) {
      flush(); out.push(l.text.replace(NUMBERED, (_, n) => `${n}. `));
    } else {
      const gap = prev && prev.page === l.page ? l.y - prev.y : 0;
      if (prev && (prev.page !== l.page ? false : gap > body * 2.1)) flush();
      para.push(l.text);
    }
    prev = l;
  });
  flush();

  // Blank line between blocks, but list items stay together.
  let md = "";
  out.forEach((b, i) => {
    const list = /^(- |\d+\. )/.test(b), prevList = i > 0 && /^(- |\d+\. )/.test(out[i - 1]);
    md += (i === 0 ? "" : list && prevList ? "\n" : "\n\n") + b;
  });
  return md + "\n";
}
