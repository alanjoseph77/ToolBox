export interface AgeResult { years: number; months: number; days: number; totalDays: number; totalMonths: number; nextBirthdayInDays: number; nextBirthdayWeekday: string }

const utc = (y: number, m: number, d: number) => Date.UTC(y, m, d);
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** Exact age between two calendar dates given as yyyy-mm-dd. */
export function age(dob: string, on: string): AgeResult {
  const [y1, m1, d1] = dob.split("-").map(Number), [y2, m2, d2] = on.split("-").map(Number);
  if (![y1, m1, d1, y2, m2, d2].every(Number.isFinite)) throw new Error("Enter valid dates");
  if (utc(y1, m1 - 1, d1) > utc(y2, m2 - 1, d2)) throw new Error("Date of birth is after the other date");
  // Count whole months from the birth date; a day that does not exist (31 Feb) falls on the last day of that month.
  const onT = utc(y2, m2 - 1, d2);
  const addMonths = (n: number) => { const y = y1 + Math.floor((m1 - 1 + n) / 12), m = (((m1 - 1 + n) % 12) + 12) % 12; return utc(y, m, Math.min(d1, daysInMonth(y, m))); };
  let tm = (y2 - y1) * 12 + (m2 - m1);
  if (addMonths(tm) > onT) tm--;
  const years = Math.floor(tm / 12), months = tm % 12, days = Math.round((onT - addMonths(tm)) / 86400000);
  const totalDays = Math.round((utc(y2, m2 - 1, d2) - utc(y1, m1 - 1, d1)) / 86400000);
  // next birthday (29 Feb birthdays fall on 28 Feb in non-leap years)
  const bday = (y: number) => (m1 === 2 && d1 === 29 && daysInMonth(y, 1) === 28 ? utc(y, 1, 28) : utc(y, m1 - 1, d1));
  let next = bday(y2); if (next < utc(y2, m2 - 1, d2)) next = bday(y2 + 1);
  const nextDays = Math.round((next - utc(y2, m2 - 1, d2)) / 86400000);
  return { years, months, days, totalDays, totalMonths: years * 12 + months, nextBirthdayInDays: nextDays, nextBirthdayWeekday: new Date(next).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" }) };
}
