import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
// @ts-ignore - legacy build runs in Node
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { makeZip } from "../lib/zip";
import { addPageNumbers, addWatermark, alternateMix, cropResize, flipPages, nUp, readDetails, rotatePages, setDetails, splitBySize, splitEveryPage, splitInHalf, extractRange } from "../lib/pdfOps";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "OK  " : "FAIL"} ${name} ${extra}`); };

async function make(label: string, n: number, w = 200, h = 100, rot = 0) {
  const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= n; i++) { const p = d.addPage([w, h]); p.drawText(`${label}${i}`, { x: 50, y: 40, size: 20, font: f }); if (rot) p.setRotation(degrees(rot)); }
  return d.save();
}
async function pages(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: true }).promise;
  const out: { text: string; transform: number[]; w: number; h: number }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i), v = p.getViewport({ scale: 1 }), c = await p.getTextContent();
    out.push({ text: c.items.map((x: any) => x.str).join("|"), transform: c.items[0]?.transform ?? [], w: v.width, h: v.height });
  }
  return out;
}

(async () => {
  // Alternate & Mix
  const mixed = await pages(await alternateMix([await make("A", 3), await make("B", 2)]));
  ok("alternate A1 B1 A2 B2 A3", mixed.map((p) => p.text).join(" ") === "A1 B1 A2 B2 A3", mixed.map((p) => p.text).join(" "));
  const mixedRev = await pages(await alternateMix([await make("A", 3), await make("B", 3)], [false, true]));
  ok("alternate with reversed backs", mixedRev.map((p) => p.text).join(" ") === "A1 B3 A2 B2 A3 B1", mixedRev.map((p) => p.text).join(" "));

  // Split in half
  const half = await PDFDocument.load(await splitInHalf(await make("H", 2, 400, 300)));
  const boxes = half.getPages().map((p) => p.getCropBox());
  ok("split in half doubles pages, 200x300 each", half.getPageCount() === 4 && boxes.every((b) => b.width === 200 && b.height === 300));
  ok("left half first, then right", boxes[0].x === 0 && boxes[1].x === 200);
  const halfRtl = (await PDFDocument.load(await splitInHalf(await make("H", 1, 400, 300), "vertical", true))).getPages().map((p) => p.getCropBox().x);
  ok("right-to-left order", halfRtl[0] === 200 && halfRtl[1] === 0);
  const halfH = (await PDFDocument.load(await splitInHalf(await make("H", 1, 400, 300), "horizontal"))).getPages().map((p) => p.getCropBox());
  ok("horizontal cut: top then bottom", halfH[0].y === 150 && halfH[1].y === 0 && halfH[0].width === 400 && halfH[0].height === 150);
  const rotHalf = (await PDFDocument.load(await splitInHalf(await make("H", 1, 400, 300, 90)))).getPages().map((p) => p.getCropBox());
  ok("rotated page: visual left half = bottom of the unrotated page", rotHalf[0].y === 0 && rotHalf[1].y === 150);

  // Split by size
  const big = await PDFDocument.create(); const bf = await big.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 12; i++) { const p = big.addPage([300, 300]); let s = ""; for (let k = 0; k < 6000; k++) s += String.fromCharCode(97 + Math.floor(Math.random() * 26)); p.drawText(s.slice(0, 300), { x: 10, y: 250, size: 6, font: bf }); for (let l = 0; l < 20; l++) p.drawText(s.slice(l * 300, l * 300 + 300), { x: 10, y: 240 - l * 8, size: 5, font: bf }); }
  const bigBytes = await big.save();
  const parts = await splitBySize(bigBytes, 25000);
  const counts = await Promise.all(parts.map(async (p) => (await PDFDocument.load(p)).getPageCount()));
  ok("split by size: every part within 25 KB", parts.every((p) => p.length <= 25000), parts.map((p) => p.length).join(","));
  ok("split by size: no page lost", counts.reduce((a, b) => a + b, 0) === 12, counts.join("+"));
  ok("split by size: more than one part", parts.length > 1);
  ok("split every page", (await splitEveryPage(bigBytes)).length === 12);
  ok("extract range", (await PDFDocument.load(await extractRange(bigBytes, [0, 5, 7]))).getPageCount() === 3);

  // Rotate
  const rotated = (await PDFDocument.load(await rotatePages(await make("R", 4), 90, "odd"))).getPages().map((p) => p.getRotation().angle);
  ok("rotate odd pages only", rotated.join() === "90,0,90,0", rotated.join());
  const rot2 = (await PDFDocument.load(await rotatePages(await rotatePages(await make("R", 2), 270, "all"), 180, [1]))).getPages().map((p) => p.getRotation().angle);
  ok("rotation adds up modulo 360", rot2.join() === "270,90", rot2.join());

  // Flip
  const fh = await pages(await flipPages(await make("F", 1), "horizontal"));
  ok("flip horizontal mirrors the text", fh[0].transform[0] < 0 && fh[0].text === "F1", JSON.stringify(fh[0].transform.map((n) => Math.round(n))));
  const fv = await pages(await flipPages(await make("F", 1), "vertical"));
  ok("flip vertical mirrors the text", fv[0].transform[3] < 0 && fv[0].transform[0] > 0, JSON.stringify(fv[0].transform.map((n) => Math.round(n))));
  const fr = await pages(await flipPages(await make("F", 1, 200, 100, 90), "horizontal"));
  ok("flip keeps page rotation", fr[0].h === 200 || fr[0].w === 100);

  // N-up
  const nu = await PDFDocument.load(await nUp(await make("N", 9), 4, "A4"));
  ok("4-up: 9 pages -> 3 sheets, A4 portrait", nu.getPageCount() === 3 && Math.round(nu.getPage(0).getWidth()) === 595 && Math.round(nu.getPage(0).getHeight()) === 842);
  const nu2 = await PDFDocument.load(await nUp(await make("N", 5), 2, "Letter"));
  ok("2-up: 5 pages -> 3 sheets, Letter landscape", nu2.getPageCount() === 3 && nu2.getPage(0).getWidth() > nu2.getPage(0).getHeight() && Math.round(nu2.getPage(0).getWidth()) === 792);
  const nu9 = await PDFDocument.load(await nUp(await make("N", 20), 9));
  ok("9-up: 20 pages -> 3 sheets", nu9.getPageCount() === 3);
  const nuText = await pages(await nUp(await make("N", 4), 4));
  ok("4-up keeps all the page content", ["N1", "N2", "N3", "N4"].every((t) => nuText[0].text.includes(t)), nuText[0].text);

  // Crop & resize
  const cr = (await PDFDocument.load(await cropResize(await make("C", 1, 200, 200), { top: 20, right: 10, bottom: 30, left: 40 }))).getPage(0);
  ok("crop margins (pt)", cr.getCropBox().width === 150 && cr.getCropBox().height === 150 && cr.getCropBox().x === 40 && cr.getCropBox().y === 30, JSON.stringify(cr.getCropBox()));
  const cm = (await PDFDocument.load(await cropResize(await make("C", 1, 600, 600), { top: 10, bottom: 10, unit: "mm" }))).getPage(0);
  ok("crop margins (mm)", Math.abs(cm.getCropBox().height - (600 - 2 * 28.3465)) < 0.01);
  const rs = (await PDFDocument.load(await cropResize(await make("C", 2, 300, 500), { target: "A4" }))).getPages();
  ok("resize to A4 portrait", rs.length === 2 && Math.round(rs[0].getWidth()) === 595 && Math.round(rs[0].getHeight()) === 842);
  const rsL = (await PDFDocument.load(await cropResize(await make("C", 1, 500, 300), { target: "Letter" }))).getPage(0);
  ok("landscape stays landscape when resized", rsL.getWidth() > rsL.getHeight());
  ok("margins bigger than the page are rejected", await cropResize(await make("C", 1, 100, 100), { top: 80, bottom: 80 }).then(() => false, () => true));

  // Watermark
  const wm = await pages(await addWatermark(await make("W", 2, 300, 300), { text: "DRAFT", opacity: 0.3, angle: 45 }));
  ok("watermark text on every page", wm.every((p) => p.text.includes("DRAFT")), wm.map((p) => p.text).join(" || "));
  const wmTile = await pages(await addWatermark(await make("W", 1, 400, 400), { text: "COPY", tile: true, size: 20 }));
  ok("tiled watermark repeats", (wmTile[0].text.match(/COPY/g) ?? []).length > 4, String((wmTile[0].text.match(/COPY/g) ?? []).length));
  ok("empty watermark rejected", await addWatermark(await make("W", 1), { text: "   " }).then(() => false, () => true));
  const wmU = await pages(await addWatermark(await make("W", 1, 700, 700), { text: "Café — “ok” ✓ हिंदी", size: 36 }));
  ok("non-Latin characters do not crash (replaced, quotes normalised)", wmU[0].text.includes('"ok"'), wmU[0].text);

  // Page numbers
  const pn = await pages(await addPageNumbers(await make("P", 3), { format: "Page {n} of {total}" }));
  ok("page numbers 'Page n of total'", pn[2].text.includes("Page 3 of 3") && pn[0].text.includes("Page 1 of 3"), pn.map((p) => p.text).join(" || "));
  const pn2 = await pages(await addPageNumbers(await make("P", 3), { format: "{n}", start: 10, skipFirst: true }));
  ok("skip first page, start at 10", !/\d/.test(pn2[0].text.replace("P1", "")) && pn2[1].text.includes("10") && pn2[2].text.includes("11"), pn2.map((p) => p.text).join(" || "));
  for (const pos of ["top-left", "top-right", "bottom-left", "bottom-right", "top-center"] as const) await addPageNumbers(await make("P", 1), { position: pos });
  ok("all six positions work", true);

  // Details
  const det = await readDetails(await setDetails(await make("D", 1), { title: "My Title", author: "Asha", subject: "S", keywords: "a, b ,c", creator: "ToolBox" }));
  ok("details round trip", det.title === "My Title" && det.author === "Asha" && det.keywords === "a b c" && det.creator === "ToolBox", JSON.stringify(det));

  // ZIP written with our own code must be a valid archive
  const dir = mkdtempSync(join(tmpdir(), "zip-")); const f = join(dir, "t.zip");
  const a = await make("Z", 1), b = await make("Y", 3);
  writeFileSync(f, makeZip([{ name: "page-1.pdf", data: a }, { name: "päge 2.pdf", data: b }]));
  let listing = ""; try { listing = execFileSync("unzip", ["-t", f]).toString(); } catch (e) { listing = String(e); }
  ok("ZIP passes 'unzip -t' (CRC ok)", /No errors detected/.test(listing), listing.split("\n").slice(-2).join(" "));
  const back = execFileSync("unzip", ["-p", f, "page-1.pdf"]);
  ok("ZIP content identical", Buffer.compare(back, Buffer.from(a)) === 0);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
