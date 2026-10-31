import { PDFDocument } from "pdf-lib";
import { amortization, emi, gst, inr, sip } from "../lib/calc";
import { cases, words } from "../lib/textCase";
import { hashHex, md5, hashNames } from "../lib/hash";
import { buildUpiLink, isVpa } from "../lib/upi";
import { fillForm, listFields } from "../lib/pdfForms";
import { findAadhaarBoxes, type Word } from "../lib/aadhaar";
import { obscure } from "../lib/blur";
import { fitFont, wrapText } from "../lib/meme";
import { diffLines, sideBySide } from "../lib/diff";
import { pagesToMarkdown } from "../lib/pdfMarkdown";
import { fd, ppf, incomeTax } from "../lib/finance";
import { intToWords, rupeesInWords } from "../lib/words";
import { age } from "../lib/age";
import { vcardString, waLink, wifiString } from "../lib/qrText";
import { invoiceTotals } from "../lib/invoice";
import { buildInvoicePdf } from "../lib/invoicePdf";
import { applyAdjust, neutral } from "../lib/photoFilters";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "OK  " : "FAIL"} ${name} ${extra}`); };
const near = (a: number, b: number, tol = 0.05) => Math.abs(a - b) <= tol;
const enc = (s: string) => new TextEncoder().encode(s);

(async () => {
  // EMI
  const e = emi(1_000_000, 8, 240);
  ok("EMI 10L, 8%, 20 years = 8,364.40", near(e.emi, 8364.4), e.emi.toFixed(2));
  ok("EMI total interest = total - principal", near(e.totalInterest, e.totalPayment - 1_000_000, 0.01));
  ok("EMI with 0% interest", near(emi(120000, 0, 12).emi, 10000));
  const sched = amortization(500000, 9, 60);
  ok("schedule: 60 rows, balance ends at 0", sched.length === 60 && sched[59].balance === 0);
  ok("schedule: principal parts add up to the loan", near(sched.reduce((s, r) => s + r.principal, 0), 500000, 0.5));
  ok("schedule: first month interest = 500000 * 9%/12", near(sched[0].interest, 3750, 0.001));
  ok("EMI rejects empty input", (() => { try { emi(0, 8, 10); return false; } catch { return true; } })());
  // GST
  const g1 = gst(1000, 18, "exclusive");
  ok("GST 18% on 1000 → 180, total 1180, CGST=SGST=90", g1.gst === 180 && g1.total === 1180 && g1.cgst === 90 && g1.sgst === 90);
  const g2 = gst(1180, 18, "inclusive");
  ok("GST inclusive 1180 → base 1000, tax 180", near(g2.base, 1000, 1e-9) && near(g2.gst, 180, 1e-9));
  ok("GST 5% on 200 inclusive", near(gst(210, 5, "inclusive").base, 200, 1e-9));
  // SIP
  const s = sip(5000, 12, 10);
  ok("SIP 5000/month, 12%, 10 years ≈ ₹11.6 lakh", s.invested === 600000 && near(s.futureValue, 1161695, 500), s.futureValue.toFixed(0));
  ok("Indian number format", inr(1234567) === "₹12,34,567", inr(1234567));
  // text case
  ok("words() splits camel, snake, kebab", words("helloWorld_fooBar-baz qux").join(",") === "hello,world,foo,bar,baz,qux", words("helloWorld_fooBar-baz qux").join(","));
  ok("camelCase", cases.camelCase("hello big world") === "helloBigWorld");
  ok("PascalCase", cases.PascalCase("hello_big-world") === "HelloBigWorld");
  ok("snake_case from camel", cases.snake_case("helloBigWorld") === "hello_big_world");
  ok("kebab-case", cases["kebab-case"]("Hello Big World") === "hello-big-world");
  ok("CONSTANT_CASE", cases.CONSTANT_CASE("my var name") === "MY_VAR_NAME");
  ok("Title Case", cases["Title Case"]("the QUICK brown fox") === "The Quick Brown Fox", cases["Title Case"]("the QUICK brown fox"));
  ok("Sentence case", cases["Sentence case"]("hello world. THIS is it! ok") === "Hello world. This is it! Ok", cases["Sentence case"]("hello world. THIS is it! ok"));
  ok("slug removes accents", cases["slug-for-urls"]("Café Déjà Vu!") === "cafe-deja-vu");
  ok("reverse", cases["Reverse text"]("abc") === "cba");
  // hashes
  ok("MD5 empty", md5(enc("")) === "d41d8cd98f00b204e9800998ecf8427e");
  ok("MD5 abc", md5(enc("abc")) === "900150983cd24fb0d6963f7d28e17f72");
  ok("MD5 quick brown fox", md5(enc("The quick brown fox jumps over the lazy dog")) === "9e107d9d372bb6826bd81d3542a419d6");
  ok("MD5 long input (>1 block)", md5(enc("a".repeat(1000))) === "cabe45dcc9ae5b66ba86600cca6b8ba8", md5(enc("a".repeat(1000))));
  ok("SHA-256 abc", (await hashHex("SHA-256", enc("abc"))) === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  ok("SHA-1 abc", (await hashHex("SHA-1", enc("abc"))) === "a9993e364706816aba3e25717850c26c9cd0d89d");
  ok("all hash names work", (await Promise.all(hashNames.map((n) => hashHex(n, enc("x"))))).every((h) => h.length >= 32));
  // UPI
  ok("valid UPI IDs", isVpa("asha@okhdfcbank") && isVpa("9876543210@paytm") && isVpa("a.b-c_d@ybl"));
  ok("invalid UPI IDs", !isVpa("asha") && !isVpa("@bank") && !isVpa("asha@") && !isVpa("a b@bank"));
  ok("UPI link", buildUpiLink({ vpa: "asha@okbank", name: "Asha Rao", amount: "250.5", note: "Lunch & tea" }) === "upi://pay?pa=asha@okbank&pn=Asha%20Rao&am=250.50&cu=INR&tn=Lunch%20%26%20tea", buildUpiLink({ vpa: "asha@okbank", name: "Asha Rao", amount: "250.5", note: "Lunch & tea" }));
  ok("UPI link without amount", buildUpiLink({ vpa: "shop@upi" }) === "upi://pay?pa=shop@upi&cu=INR");
  ok("UPI rejects bad amount", (() => { try { buildUpiLink({ vpa: "a@b", amount: "-5" }); return false; } catch { return true; } })());
  // PDF forms
  const d = await PDFDocument.create(); const page = d.addPage([400, 400]); const form = d.getForm();
  form.createTextField("fullname").addToPage(page, { x: 20, y: 340, width: 200, height: 24 });
  form.createCheckBox("agree").addToPage(page, { x: 20, y: 300, width: 16, height: 16 });
  const dd = form.createDropdown("city"); dd.addOptions(["Chennai", "Kochi", "Pune"]); dd.addToPage(page, { x: 20, y: 250, width: 120, height: 24 });
  const rg = form.createRadioGroup("gender"); rg.addOptionToPage("Female", page, { x: 20, y: 200, width: 14, height: 14 }); rg.addOptionToPage("Male", page, { x: 60, y: 200, width: 14, height: 14 });
  const bytes = await d.save();
  const fields = await listFields(bytes);
  ok("lists 4 fields with kinds", fields.map((f) => f.kind).join() === "text,checkbox,dropdown,radio", fields.map((f) => f.kind).join());
  ok("dropdown options listed", fields.find((f) => f.name === "city")?.options?.join() === "Chennai,Kochi,Pune");
  const filled = await fillForm(bytes, { fullname: "Asha Rao", agree: true, city: "Kochi", gender: "Female" });
  const back = Object.fromEntries((await listFields(filled)).map((f) => [f.name, f.value]));
  ok("filled values read back", back.fullname === "Asha Rao" && back.agree === true && back.city === "Kochi" && back.gender === "Female", JSON.stringify(back));
  const flat = await listFields(await fillForm(bytes, { fullname: "Asha" }, true));
  ok("flatten removes the fields", flat.length === 0);
  ok("unknown field names are ignored", (await fillForm(bytes, { nothing: "x" })).length > 100);
  // Aadhaar detection
  const W = (text: string, x0: number, y0 = 100, x1 = x0 + 90, y1 = y0 + 40): Word => ({ text, x0, y0, x1, y1 });
  const a1 = findAadhaarBoxes([W("Name", 10), W("1234", 100), W("5678", 220), W("9012", 340)]);
  ok("3 groups of 4 → mask first two (8 digits)", a1.length === 1 && a1[0].x <= 100 && a1[0].x + a1[0].w >= 310 && a1[0].x + a1[0].w < 340);
  const a2 = findAadhaarBoxes([W("123456789012", 100, 100, 460, 140)]);
  ok("single 12-digit word → first 8/12 of its width", a2.length === 1 && Math.abs(a2[0].w - (240 + 8)) < 2, JSON.stringify(a2));
  const a3 = findAadhaarBoxes([W("12345678", 100, 100, 280, 140), W("9012", 300, 100, 390, 140)]);
  ok("8 + 4 split", a3.length === 1);
  ok("phone number (10 digits) is not masked", findAadhaarBoxes([W("9876543210", 100)]).length === 0);
  ok("date and PIN are not masked", findAadhaarBoxes([W("12/04/1990", 10), W("682001", 200)]).length === 0);
  ok("groups on different lines are not joined", findAadhaarBoxes([W("1234", 100, 100, 190, 140), W("5678", 220, 300, 310, 340), W("9012", 340, 500, 430, 540)]).length === 0);
  const a4 = findAadhaarBoxes([W("1234", 100), W("5678", 220), W("9012", 340), W("VID", 10, 300, 60, 340), W("1111", 100, 300), W("2222", 220, 300), W("3333", 340, 300)]);
  ok("two numbers on one card", a4.length === 2);
  // Blur / pixelate
  {
    const mk = (w: number, h: number) => { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { const v = (i % w) % 2 ? 255 : 0; d.set([v, v, v, 255], i * 4); } return { data: d, width: w, height: h }; };
    const a = mk(40, 40), before = Array.from(a.data);
    obscure(a, { x: 10, y: 10, w: 20, h: 20 }, "blur", 5);
    const inside = a.data[(20 * 40 + 20) * 4], outside = a.data[(5 * 40 + 5) * 4] === before[(5 * 40 + 5) * 4];
    ok("blur smooths the stripes inside the area", inside > 60 && inside < 200, `(value ${inside})`);
    ok("blur leaves the rest untouched", outside);
    const b = mk(40, 40); obscure(b, { x: 0, y: 0, w: 40, h: 40 }, "pixelate", 10);
    ok("pixelate makes blocks of one colour", b.data[0] === b.data[4] && b.data[0] === b.data[(1 * 40 + 1) * 4]);
    const c = mk(40, 40); obscure(c, { x: 0, y: 0, w: 40, h: 40 }, "blur", 5, true);
    ok("round shape keeps the corners", c.data[0] === 0 && c.data[4] === 255);
    ok("area outside the image is ignored", obscure(mk(10, 10), { x: 50, y: 50, w: 5, h: 5 }, "blur", 5) === false);
  }
  // Meme text fitting
  {
    const m = (s: string) => s.length * 10;
    const lines = wrapText(m, "ONE DOES NOT SIMPLY WALK", 100);
    ok("meme text wraps within the width", lines.every((l) => m(l) <= 100) && lines.length >= 3, JSON.stringify(lines));
    const f = fitFont((size) => (s) => s.length * size * 0.5, "WHEN THE CODE WORKS ON THE FIRST TRY", 300, 60, 60);
    ok("meme font shrinks to fit the box", f.size < 60 && f.lines.length * f.size * 1.12 <= 60, `(size ${f.size}, ${f.lines.length} lines)`);
  }
  // Diff
  {
    const ops = diffLines(["a", "b", "c", "d"], ["a", "x", "c", "d", "e"])!;
    ok("diff finds one change and one addition", ops.filter((o) => o.type === "del").map((o) => o.text).join() === "b" && ops.filter((o) => o.type === "add").map((o) => o.text).join() === "x,e");
    ok("identical documents have no differences", diffLines(["a", "b"], ["a", "b"])!.every((o) => o.type === "same"));
    const rows = sideBySide(ops).filter((r) => r.changed);
    ok("changed lines are paired side by side", rows[0].left === "b" && rows[0].right === "x" && rows[1].left === undefined && rows[1].right === "e");
    ok("huge inputs are refused, not frozen", diffLines(Array.from({ length: 6000 }, (_, i) => "a" + i), Array.from({ length: 6000 }, (_, i) => "b" + i)) === null);
  }
  // PDF to Markdown
  {
    const it = (str: string, y: number, h: number) => ({ str, x: 50, y, w: str.length * 5, h });
    const page = [it("Annual Report", 60, 24), it("This is the first line of a long body paragraph", 100, 11), it("and it continues on the second line.", 113, 11), it("Results", 160, 16), it("• First point", 190, 11), it("• Second point", 203, 11), it("1. Step one", 230, 11), it("Closing paragraph far below.", 300, 11), it("3", 800, 10)];
    const md = pagesToMarkdown([page]);
    ok("markdown has an h1 and an h2", md.includes("# Annual Report") && md.includes("## Results"), JSON.stringify(md));
    ok("markdown joins wrapped lines into a paragraph", md.includes("body paragraph and it continues on the second line."));
    ok("markdown makes bullet and numbered lists", md.includes("- First point\n- Second point") && md.includes("1. Step one"));
    ok("markdown drops bare page numbers", !/\n3\n/.test(md) && !md.trim().endsWith("3"));
  }
  // Finance
  {
    ok("FD: 1 lakh at 7% for 5 years, quarterly", near(fd(100000, 7, 5).maturity, 141478, 5), `(${Math.round(fd(100000, 7, 5).maturity)})`);
    ok("PPF: 1.5 lakh a year for 15 years at 7.1%", near(ppf(150000, 7.1, 15).maturity, 4069000, 3000), `(${Math.round(ppf(150000, 7.1, 15).maturity)})`);
    ok("PPF invested total", ppf(150000, 7.1, 15).invested === 2250000);
  }
  // Income tax (new regime, FY 2025-26)
  {
    const n = (g: number) => incomeTax({ income: g, regime: "new" });
    ok("tax: 12.75 lakh salary is nil after rebate", n(1275000).total === 0);
    ok("tax: 15 lakh salary", near(n(1500000).total, 97500, 1), `(${n(1500000).total})`);
    ok("tax: 25 lakh salary", near(n(2500000).total, 319800, 1), `(${n(2500000).total})`);
    ok("tax: marginal relief just above 12 lakh taxable", near(n(1285000).total, 10400, 1), `(${n(1285000).total})`);
    const o = incomeTax({ income: 1000000, regime: "old", deductions: 150000 });
    ok("tax: old regime 10 lakh with 1.5 lakh deductions", near(o.total, 75400, 1) && o.taxable === 800000, `(${o.total})`);
    ok("tax: old regime rebate up to 5 lakh taxable", incomeTax({ income: 550000, regime: "old" }).total === 0);
    ok("tax: negative income rejected", (() => { try { incomeTax({ income: -1, regime: "new" }); return false; } catch { return true; } })());
  }
  // Number to words
  {
    ok("words: Indian style", intToWords(1234567) === "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven", intToWords(1234567));
    ok("words: crore", intToWords(250000000) === "Twenty Five Crore");
    ok("words: international style", intToWords(1234567, "international") === "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven");
    ok("words: zero and teens", intToWords(0) === "Zero" && intToWords(15) === "Fifteen" && intToWords(100) === "One Hundred" && intToWords(100000) === "One Lakh");
    ok("words: rupees and paise", rupeesInWords(1234.5) === "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only", rupeesInWords(1234.5));
    ok("words: whole rupees", rupeesInWords(500) === "Rupees Five Hundred Only");
  }
  // Age
  {
    const a = age("1990-04-12", "2026-11-03");
    ok("age: 36 years 6 months 22 days", a.years === 36 && a.months === 6 && a.days === 22, JSON.stringify(a));
    ok("age: next birthday in 160 days", a.nextBirthdayInDays === 160, `(${a.nextBirthdayInDays})`);
    const b = age("2000-02-29", "2023-03-01"); ok("age: leap-day birthday", b.years === 23 && b.months === 0 && b.days === 1, JSON.stringify(b));
    const c = age("2000-01-31", "2000-03-01"); ok("age: month-end borrowing", c.months === 1 && c.days === 1, JSON.stringify(c));
    ok("age: future date of birth rejected", (() => { try { age("2030-01-01", "2026-01-01"); return false; } catch { return true; } })());
  }
  // QR text and WhatsApp
  {
    ok("wifi string", wifiString("My;Net", "p:ss,1", "WPA") === "WIFI:T:WPA;S:My\\;Net;P:p\\:ss\\,1;;", wifiString("My;Net", "p:ss,1", "WPA"));
    ok("wifi open network has no password", wifiString("Cafe", "", "nopass") === "WIFI:T:nopass;S:Cafe;;");
    ok("wifi hidden flag", wifiString("A", "b", "WPA", true).includes("H:true;"));
    const v = vcardString({ first: "Asha", last: "Rao", org: "Otaga, Inc", phone: "+91 98765 43210", email: "a@x.in" });
    ok("vcard fields", v.startsWith("BEGIN:VCARD\nVERSION:3.0") && v.includes("N:Rao;Asha") && v.includes("FN:Asha Rao") && v.includes("ORG:Otaga\\, Inc") && v.endsWith("END:VCARD"), v);
    ok("whatsapp: 10 digit gets +91", waLink("98765 43210", "Hi there") === "https://wa.me/919876543210?text=Hi%20there");
    ok("whatsapp: country code kept", waLink("+1 (415) 555-2671", "") === "https://wa.me/14155552671");
    ok("whatsapp: too short rejected", (() => { try { waLink("123", ""); return false; } catch { return true; } })());
  }
  // Invoice
  {
    const items = [{ desc: "Web design", qty: 2, rate: 5000, gstPct: 18 }, { desc: "Hosting", qty: 1, rate: 1999.5, gstPct: 5 }];
    const a = invoiceTotals(items, false), b = invoiceTotals(items, true);
    ok("invoice: subtotal and GST", a.subtotal === 11999.5 && near(a.gstTotal, 1899.98, 0.01), JSON.stringify(a));
    ok("invoice: CGST + SGST equal GST", near(a.cgst + a.sgst, a.gstTotal, 0.001) && a.igst === 0);
    ok("invoice: IGST between states", b.cgst === 0 && b.sgst === 0 && near(b.igst, a.gstTotal, 0.001));
    ok("invoice: total is rounded to a whole rupee", Number.isInteger(a.total) && near(a.total, a.subtotal + a.gstTotal, 0.5), `(${a.total}, round off ${a.roundOff})`);
    ok("invoice: discount", near(invoiceTotals(items, false, 10).subtotal, 10799.55, 0.01));
    const bytes = await buildInvoicePdf({ title: "TAX INVOICE", number: "INV-001", date: "03 Nov 2026", seller: { name: "Otaga", address: "Kochi, Kerala", gstin: "32ABCDE1234F1Z5" }, buyer: { name: "Asha Rao ₹" }, items: Array.from({ length: 40 }, (_, i) => ({ desc: "Item " + (i + 1) + " with a fairly long description to force wrapping onto more lines", qty: 1, rate: 100, gstPct: 18 })), interState: false, notes: "Thanks", upi: "otaga@upi" });
    const doc = await PDFDocument.load(bytes);
    ok("invoice pdf: long invoice runs over several pages", doc.getPageCount() >= 2, `(${doc.getPageCount()} pages, ${Math.round(bytes.length / 1024)} KB)`);
  }
  // Photo adjustments
  {
    const mk = () => ({ data: new Uint8ClampedArray([100, 120, 140, 255, 200, 50, 50, 255]) });
    const a = mk(); applyAdjust(a, neutral);
    ok("adjust: neutral leaves pixels alone", Array.from(a.data).join() === "100,120,140,255,200,50,50,255", Array.from(a.data).join());
    const b = mk(); applyAdjust(b, { ...neutral, brightness: 20 });
    ok("adjust: brightness lifts every channel", b.data[0] > 100 && b.data[1] > 120 && b.data[2] > 140);
    const g = mk(); applyAdjust(g, { ...neutral, gray: true });
    ok("adjust: black and white makes R=G=B", g.data[0] === g.data[1] && g.data[1] === g.data[2] && g.data[4] === g.data[5]);
    const s = mk(); applyAdjust(s, { ...neutral, saturation: -100 });
    ok("adjust: zero saturation is grey", s.data[4] === s.data[5] && s.data[5] === s.data[6]);
    const w = mk(); applyAdjust(w, { ...neutral, warmth: 50 });
    ok("adjust: warmth raises red and lowers blue", w.data[0] > 100 && w.data[2] < 140);
    const c = mk(); applyAdjust(c, { ...neutral, brightness: 100, contrast: 100 });
    ok("adjust: values stay within 0 to 255", Array.from(c.data).every((v) => v >= 0 && v <= 255));
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
