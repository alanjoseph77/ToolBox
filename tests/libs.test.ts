import { PDFDocument } from "pdf-lib";
import { amortization, emi, gst, inr, sip } from "../lib/calc";
import { cases, words } from "../lib/textCase";
import { hashHex, md5, hashNames } from "../lib/hash";
import { buildUpiLink, isVpa } from "../lib/upi";
import { fillForm, listFields } from "../lib/pdfForms";
import { findAadhaarBoxes, type Word } from "../lib/aadhaar";

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
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
