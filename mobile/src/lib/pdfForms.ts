import { PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField } from "pdf-lib";

export type FieldKind = "text" | "checkbox" | "dropdown" | "radio" | "list";
export interface FormField { name: string; kind: FieldKind; options?: string[]; value: string | boolean; multiline?: boolean }
export type FormValues = Record<string, string | boolean>;

const load = (src: Uint8Array | ArrayBuffer | string) => PDFDocument.load(src, { ignoreEncryption: true, updateMetadata: false });

export async function listFields(src: Uint8Array | ArrayBuffer | string): Promise<FormField[]> {
  const form = (await load(src)).getForm();
  const out: FormField[] = [];
  for (const f of form.getFields()) {
    const name = f.getName();
    if (f instanceof PDFTextField) out.push({ name, kind: "text", value: f.getText() ?? "", multiline: f.isMultiline() });
    else if (f instanceof PDFCheckBox) out.push({ name, kind: "checkbox", value: f.isChecked() });
    else if (f instanceof PDFDropdown) out.push({ name, kind: "dropdown", options: f.getOptions(), value: f.getSelected()[0] ?? "" });
    else if (f instanceof PDFRadioGroup) out.push({ name, kind: "radio", options: f.getOptions(), value: f.getSelected() ?? "" });
    else if (f instanceof PDFOptionList) out.push({ name, kind: "list", options: f.getOptions(), value: f.getSelected()[0] ?? "" });
  }
  return out;
}

/** Writes the values into the form. `flatten` turns the fields into normal page content. */
export async function fillForm(src: Uint8Array | ArrayBuffer | string, values: FormValues, flatten = false): Promise<Uint8Array> {
  const doc = await load(src);
  const form = doc.getForm();
  for (const [name, v] of Object.entries(values)) {
    const f = form.getFieldMaybe(name);
    if (!f) continue;
    if (f instanceof PDFTextField) f.setText(String(v) || undefined);
    else if (f instanceof PDFCheckBox) (v ? f.check() : f.uncheck());
    else if (f instanceof PDFDropdown) { if (v) f.select(String(v)); else f.clear(); }
    else if (f instanceof PDFRadioGroup) { if (v) f.select(String(v)); }
    else if (f instanceof PDFOptionList) { if (v) f.select(String(v)); else f.clear(); }
  }
  form.updateFieldAppearances();
  if (flatten) form.flatten();
  return doc.save();
}
