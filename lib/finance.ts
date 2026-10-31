export interface FdResult { invested: number; maturity: number; interest: number }

/** Fixed deposit with interest added `perYear` times a year (banks usually compound quarterly). */
export function fd(principal: number, annualRatePct: number, years: number, perYear = 4): FdResult {
  if (principal < 0 || years < 0 || annualRatePct < 0) throw new Error("Values cannot be negative");
  const maturity = principal * Math.pow(1 + annualRatePct / 100 / perYear, perYear * years);
  return { invested: principal, maturity, interest: maturity - principal };
}

export interface PpfRow { year: number; deposit: number; interest: number; balance: number }

/** PPF with a deposit at the start of every year and interest added once a year. */
export function ppf(yearlyDeposit: number, annualRatePct: number, years: number): { rows: PpfRow[]; invested: number; maturity: number; interest: number } {
  if (yearlyDeposit < 0 || years < 1) throw new Error("Enter a positive deposit and years");
  const rows: PpfRow[] = [];
  let bal = 0;
  for (let y = 1; y <= years; y++) {
    const start = bal + yearlyDeposit, interest = start * (annualRatePct / 100);
    bal = start + interest;
    rows.push({ year: y, deposit: yearlyDeposit, interest, balance: bal });
  }
  const invested = yearlyDeposit * years;
  return { rows, invested, maturity: bal, interest: bal - invested };
}

export type Regime = "new" | "old";
export type AgeGroup = "below60" | "senior" | "super";
export interface TaxInput { income: number; regime: Regime; age?: AgeGroup; deductions?: number; salaried?: boolean }
export interface TaxResult { taxable: number; slabTax: number; rebate: number; surcharge: number; cess: number; total: number; effectivePct: number; monthly: number }

const NEW_SLABS: [number, number][] = [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]];
const OLD_SLABS: Record<AgeGroup, [number, number][]> = {
  below60: [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]],
  senior: [[300000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]],
  super: [[500000, 0], [1000000, 0.2], [Infinity, 0.3]],
};

function slabTax(taxable: number, slabs: [number, number][]) {
  let tax = 0, lower = 0;
  for (const [upper, rate] of slabs) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

/** Estimated income tax for FY 2025-26 (AY 2026-27). An estimate only: surcharge marginal relief is not applied. */
export function incomeTax(i: TaxInput): TaxResult {
  if (i.income < 0) throw new Error("Income cannot be negative");
  const salaried = i.salaried ?? true;
  const std = salaried ? (i.regime === "new" ? 75000 : 50000) : 0;
  const taxable = Math.max(0, i.income - std - (i.regime === "old" ? Math.max(0, i.deductions ?? 0) : 0));
  const tax = slabTax(taxable, i.regime === "new" ? NEW_SLABS : OLD_SLABS[i.age ?? "below60"]);

  let afterRebate = tax;
  if (i.regime === "new") {
    if (taxable <= 1200000) afterRebate = 0;
    else afterRebate = Math.min(tax, taxable - 1200000); // marginal relief just above the rebate limit
  } else if (taxable <= 500000) afterRebate = Math.max(0, tax - 12500);
  const rebate = tax - afterRebate;

  const surchargeRate = taxable > 20000000 ? (i.regime === "new" ? 0.25 : taxable > 50000000 ? 0.37 : 0.25) : taxable > 10000000 ? 0.15 : taxable > 5000000 ? 0.1 : 0;
  const surcharge = afterRebate * surchargeRate;
  const cess = (afterRebate + surcharge) * 0.04;
  const total = afterRebate + surcharge + cess;
  return { taxable, slabTax: tax, rebate, surcharge, cess, total, effectivePct: i.income > 0 ? (total / i.income) * 100 : 0, monthly: total / 12 };
}
