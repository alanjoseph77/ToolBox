export interface EmiResult { emi: number; totalInterest: number; totalPayment: number; months: number }

/** Standard reducing-balance EMI. */
export function emi(principal: number, annualRatePct: number, months: number): EmiResult {
  if (!(principal > 0) || !(months > 0)) throw new Error("Enter a loan amount and a tenure.");
  const r = annualRatePct / 12 / 100;
  const e = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return { emi: e, totalPayment: e * months, totalInterest: e * months - principal, months };
}

export interface ScheduleRow { month: number; interest: number; principal: number; balance: number }

export function amortization(principal: number, annualRatePct: number, months: number): ScheduleRow[] {
  const { emi: e } = emi(principal, annualRatePct, months);
  const r = annualRatePct / 12 / 100;
  let balance = principal;
  const rows: ScheduleRow[] = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r, princ = e - interest;
    balance = Math.max(0, balance - princ);
    rows.push({ month: m, interest, principal: princ, balance: m === months ? 0 : balance });
  }
  return rows;
}

export interface GstResult { base: number; gst: number; total: number; cgst: number; sgst: number }

/** "exclusive": `amount` is the price before GST. "inclusive": `amount` already contains GST. */
export function gst(amount: number, ratePct: number, mode: "exclusive" | "inclusive"): GstResult {
  if (!(amount >= 0)) throw new Error("Enter an amount.");
  const base = mode === "exclusive" ? amount : amount / (1 + ratePct / 100);
  const tax = base * (ratePct / 100);
  return { base, gst: tax, total: base + tax, cgst: tax / 2, sgst: tax / 2 };
}

export interface SipResult { invested: number; futureValue: number; returns: number }

/** Monthly SIP with the instalment paid at the start of each month. */
export function sip(monthly: number, annualRatePct: number, years: number): SipResult {
  const n = Math.round(years * 12), r = annualRatePct / 12 / 100;
  const fv = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return { invested: monthly * n, futureValue: fv, returns: fv - monthly * n };
}

/** Indian digit grouping: 12,34,567.00 */
export const inr = (n: number, digits = 0) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
