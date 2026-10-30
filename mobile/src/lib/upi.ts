/** UPI IDs look like name@bank (letters, digits, dots, dashes, underscores before the @). */
export const isVpa = (s: string) => /^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(s.trim());

export interface UpiInput { vpa: string; name?: string; amount?: string; note?: string }

/** Builds the standard `upi://pay` deep link that every UPI app understands. */
export function buildUpiLink(i: UpiInput): string {
  if (!isVpa(i.vpa)) throw new Error("Enter a valid UPI ID, for example name@okbank.");
  const q: [string, string][] = [["pa", i.vpa.trim()]];
  if (i.name?.trim()) q.push(["pn", i.name.trim()]);
  const amt = i.amount?.trim();
  if (amt) {
    if (!/^\d+(\.\d{1,2})?$/.test(amt) || Number(amt) <= 0) throw new Error("Amount must be a positive number with at most 2 decimals.");
    q.push(["am", Number(amt).toFixed(2)]);
  }
  q.push(["cu", "INR"]);
  if (i.note?.trim()) q.push(["tn", i.note.trim().slice(0, 50)]);
  // pa keeps its "@" readable; everything else is percent-encoded
  return "upi://pay?" + q.map(([k, v]) => `${k}=${k === "pa" ? v : encodeURIComponent(v)}`).join("&");
}
