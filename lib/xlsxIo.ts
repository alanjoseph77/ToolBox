import readXlsxFile from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import { parseCsv } from "./csv";
import { cellText, guessType } from "./sheet";

export interface Sheet { name: string; rows: string[][] }

/** Reads a spreadsheet file: .xlsx (every sheet) or .csv / .tsv / .txt (one sheet). Old .xls files are not supported. */
export async function readSheets(file: File): Promise<Sheet[]> {
  if (/\.xls$/i.test(file.name)) throw new Error("Old .xls files are not supported. Save the file as .xlsx or .csv in Excel first.");
  if (/\.(csv|tsv|txt)$/i.test(file.name) || file.type.startsWith("text/")) {
    const rows = parseCsv(await file.text(), /\.tsv$/i.test(file.name) ? "\t" : undefined);
    if (!rows.length) throw new Error("This file is empty.");
    return [{ name: file.name.replace(/\.[^.]+$/, "") || "Sheet1", rows }];
  }
  let sheets;
  try { sheets = await readXlsxFile(file); } catch { throw new Error("This does not look like a valid .xlsx file. It may be damaged, or it may be an old .xls file that was renamed."); }
  return sheets.map((s) => ({ name: s.sheet, rows: (s.data as unknown[][]).map((r) => r.map((c) => cellText(c as never))) }));
}

const SAFE = /[\\/?*[\]:]/g;
/** Excel sheet names are at most 31 characters, cannot repeat and cannot contain \ / ? * [ ] : */
export function sheetNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((n) => {
    const base = (n.replace(SAFE, " ").trim() || "Sheet").slice(0, 28);
    let name = base, k = 2;
    while (used.has(name.toLowerCase())) name = `${base.slice(0, 28 - String(k).length - 1)} ${k++}`;
    used.add(name.toLowerCase());
    return name;
  });
}

/** Builds an .xlsx file. Numbers become real numbers unless `asText` is set. The first row is bold when `header` is set. */
export async function writeSheets(sheets: Sheet[], opts: { header?: boolean; asText?: boolean } = {}): Promise<Blob> {
  const names = sheetNames(sheets.map((s) => s.name));
  const data = sheets.map((s, si) => ({
    sheet: names[si],
    data: (s.rows.length ? s.rows : [[""]]).map((r, ri) => r.map((c) => {
      const v = opts.asText ? c : guessType(c);
      const bold = opts.header && ri === 0 ? { fontWeight: "bold" as const } : {};
      return typeof v === "number" ? { value: v, type: Number, ...bold } : typeof v === "boolean" ? { value: v, type: Boolean, ...bold } : { value: v as string, type: String, ...bold };
    })),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (writeXlsxFile(data as any) as any).toBlob();
}
