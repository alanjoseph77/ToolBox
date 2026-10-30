import { PDFDocument } from "pdf-lib";
import { randomBytes } from "node:crypto";
import { b64DecodeUtf8, b64EncodeUtf8, convertUnit, decodeJwt, findMatches, makePassword, wordStats } from "../src/lib/text";
import { extractPages, jpegsToPdf, mergePdfs, pageCount, parseRanges } from "../src/lib/pdf";

import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "OK  " : "FAIL"} ${name} ${extra}`); };
const mk = async (n: number) => { const d = await PDFDocument.create(); for (let i = 0; i < n; i++) d.addPage([200, 200]); return d.saveAsBase64(); };

(async () => {
  // the PDF engine is shared with the website; the copies must stay identical (run scripts/sync-pdfops.mjs)
  for (const f of ["pdfOps.ts", "zip.ts", "ranges.ts", "calc.ts", "textCase.ts", "hash.ts", "upi.ts", "pdfForms.ts"]) ok(`mobile copy of ${f} matches the website`, readFileSync(`../lib/${f}`, "utf8") === readFileSync(`src/lib/${f}`, "utf8"));
  // PDF
  const merged = await mergePdfs([await mk(2), await mk(3)]);
  ok("merge 2+3 pages", (await pageCount(merged)) === 5, `→ ${await pageCount(merged)}`);
  ok("extract 1-2,5", (await pageCount(await extractPages(merged, parseRanges("1-2, 5", 5)))) === 3);
  ok("parseRanges rejects 9 of 5", (() => { try { parseRanges("9", 5); return false; } catch { return true; } })());
  ok("parseRanges rejects 'abc'", (() => { try { parseRanges("abc", 5); return false; } catch { return true; } })());
  // 1x1 JPEG → PDF
  const jpg = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  try { ok("images → PDF (1 page)", (await pageCount(await jpegsToPdf([jpg]))) === 1); } catch (e) { ok("images → PDF", false, String(e)); }
  // text helpers
  const s = "héllo ToolBox ✓ 😀";
  ok("base64 UTF-8 round trip", b64DecodeUtf8(b64EncodeUtf8(s)) === s);
  ok("base64 url-safe round trip", b64DecodeUtf8(b64EncodeUtf8(s, true)) === s && !/[+/=]/.test(b64EncodeUtf8(s, true)));
  ok("base64 known value", b64EncodeUtf8("héllo ✓") === "aMOpbGxvIOKckw==");
  const jwt = decodeJwt("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQXNoYSIsImV4cCI6OTk5OTk5OTk5OX0.sig");
  ok("JWT payload", jwt.payload.name === "Asha" && jwt.payload.exp === 9999999999);
  ok("JWT rejects junk", (() => { try { decodeJwt("abc"); return false; } catch { return true; } })());
  ok("5 m → 0.005 km", convertUnit("Length", 5, "Metre", "Kilometre") === 0.005);
  ok("100 °C → 212 °F", Math.abs(convertUnit("Temperature", 100, "Celsius", "Fahrenheit") - 212) < 1e-9);
  ok("1 GB → 1024 MB", convertUnit("Data", 1, "GB", "MB") === 1024);
  const w = wordStats("One two three. Four five!\n\nNew para here.");
  ok("word stats", w.words === 8 && w.paragraphs === 2 && w.sentences === 3, JSON.stringify(w));
  const pw = makePassword(24, { lower: true, upper: true, digits: true, symbols: true }, (n) => new Uint8Array(randomBytes(n)));
  ok("password length 24 with every type", pw.password.length === 24 && /[a-z]/.test(pw.password) && /[A-Z]/.test(pw.password) && /\d/.test(pw.password) && /[^A-Za-z0-9]/.test(pw.password), pw.password);
  ok("password: no types → empty", makePassword(10, { lower: false, upper: false, digits: false, symbols: false }, (n) => new Uint8Array(randomBytes(n))).password === "");
  const uniq = new Set(Array.from({ length: 200 }, () => makePassword(16, { lower: true, upper: true, digits: true, symbols: false }, (n) => new Uint8Array(randomBytes(n))).password));
  ok("200 passwords all different", uniq.size === 200);
  const m = findMatches("(\\w+)@(\\w+)\\.com", "g", "a@b.com, c@d.com");
  ok("regex 2 matches with groups", m.length === 2 && m[0].groups[0] === "a" && m[1].groups[1] === "d");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
