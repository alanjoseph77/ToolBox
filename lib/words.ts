const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const below1000 = (n: number): string => {
  const h = Math.floor(n / 100), r = n % 100;
  const rest = r < 20 ? ones[r] : tens[Math.floor(r / 10)] + (r % 10 ? " " + ones[r % 10] : "");
  return [h ? ones[h] + " Hundred" : "", rest].filter(Boolean).join(" ");
};

/** Whole number in words. Indian style uses lakh and crore; international style uses million and billion. */
export function intToWords(n: number, style: "indian" | "international" = "indian"): string {
  if (!Number.isInteger(n) || n < 0) throw new Error("Enter a whole number, zero or more");
  if (n === 0) return "Zero";
  if (n > 999999999999999) throw new Error("That number is too large");
  const parts: string[] = [];
  if (style === "indian") {
    const units: [number, string][] = [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]];
    let rest = n;
    for (const [v, name] of units) {
      const q = Math.floor(rest / v);
      if (q) parts.push((q >= 100 ? intToWords(q, "indian") : below1000(q)) + " " + name);
      rest %= v;
    }
    if (rest) parts.push(below1000(rest));
  } else {
    const units: [number, string][] = [[1e12, "Trillion"], [1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
    let rest = n;
    for (const [v, name] of units) { const q = Math.floor(rest / v); if (q) parts.push(below1000(q) + " " + name); rest %= v; }
    if (rest) parts.push(below1000(rest));
  }
  return parts.join(" ");
}

/** An amount in rupees and paise, as written on a cheque. */
export function rupeesInWords(amount: number): string {
  if (amount < 0) throw new Error("Amount cannot be negative");
  const total = Math.round(amount * 100), rupees = Math.floor(total / 100), paise = total % 100;
  const r = `Rupees ${intToWords(rupees)}`;
  return paise ? `${r} and ${intToWords(paise)} Paise Only` : `${r} Only`;
}
