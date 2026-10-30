/* eslint-disable @typescript-eslint/no-explicit-any */
// pdf.js is loaded from a CDN at runtime: its ES-module build can't be minified by Next's bundler.
const BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/";
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
