/* eslint-disable @typescript-eslint/no-explicit-any */
// pdf.js is served from /vendor (see scripts/copy-vendor.mjs): its ES-module build
// can't be minified by Next's bundler, so it is loaded at runtime instead.
const BASE = "/vendor/pdfjs/";
let lib: Promise<any> | null = null;

export function getPdfjs(): Promise<any> {
  lib ??= import(/* webpackIgnore: true */ BASE + "pdf.min.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.mjs";
    return m;
  });
  return lib;
}

export async function openPdf(file: File): Promise<any> {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

export async function renderPage(pdf: any, pageNumber: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
  return canvas;
}

export interface TextItem { str: string; x: number; y: number; w: number; h: number }

/** Text items of one page with positions in a top-left origin, in PDF points. */
export async function pageTextItems(pdf: any, pageNumber: number): Promise<TextItem[]> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  return content.items
    .filter((i: any) => typeof i.str === "string" && i.str.trim())
    .map((i: any) => ({ str: i.str, x: i.transform[4], y: viewport.height - i.transform[5], w: i.width, h: i.height || Math.abs(i.transform[3]) }));
}

/** Groups text items into visual lines (items sharing a baseline), left to right. */
export function toLines(items: TextItem[]): TextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: TextItem[][] = [];
  for (const it of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - it.y) < Math.max(3, it.h * 0.5)) line.push(it);
    else lines.push([it]);
  }
  return lines.map((l) => l.sort((a, b) => a.x - b.x));
}
