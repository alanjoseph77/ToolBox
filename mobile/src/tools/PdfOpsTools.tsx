import { useState, type ReactNode } from "react";
import { Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Body, Button, Card, Chips, ErrorText, Field, Label, Output, Row, Screen } from "@/components/ui";
import { fmtBytes, outName, pickImages, pickPdfs, readBase64, shareBytes } from "@/lib/files";
import {
  addPageNumbers, addWatermark, alternateMix, cropResize, flipPages, nUp, numberPositions, pageCountOf, perSheetOptions, readDetails,
  rotatePages, setDetails, sheetSizes, splitBySize, splitEveryPage, splitInHalf, type NumberPosition, type PageSelect, type PdfDetails, type SheetSize,
} from "@/lib/pdfOps";
import { parseRanges } from "@/lib/ranges";
import { buildScanPdf } from "@/lib/scan";
import { makeZip } from "@/lib/zip";
import { useTheme } from "@/theme";

// ---------- shared helpers ----------
type Doc = { name: string; b64: string; pages: number; size: number };

function usePdf() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const pick = async () => {
    setErr("");
    const [f] = await pickPdfs(false);
    if (!f) return;
    try { const b64 = await readBase64(f.uri); setDoc({ name: f.name, b64, pages: await pageCountOf(b64), size: f.size ?? Math.round((b64.length * 3) / 4) }); }
    catch { setErr("That file is not a valid PDF (or it is password protected)."); }
  };
  return { doc, pick, err, setErr };
}

function useJob() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr((e as Error).message || "Something went wrong."); } setBusy(false); };
  return { busy, err, run };
}

function PdfScreen({ children }: { children: (doc: Doc) => ReactNode }) {
  const { doc, pick, err } = usePdf();
  return (
    <Screen>
      <Button variant="ghost" title={doc ? "Choose another PDF" : "Choose a PDF"} onPress={pick} />
      <ErrorText>{err}</ErrorText>
      {doc && <Body dim>{doc.name} · {doc.pages} page{doc.pages === 1 ? "" : "s"} · {fmtBytes(doc.size)}</Body>}
      {doc && children(doc)}
    </Screen>
  );
}

const pdf = async (name: string, bytes: Uint8Array): Promise<void> => { await shareBytes(name, "application/pdf", bytes); };
const zipOf = (parts: { name: string; bytes: Uint8Array }[]) => makeZip(parts.map((p) => ({ name: p.name, data: p.bytes })));

// ---------- tools ----------
export function AlternateMixPdf() {
  const t = useTheme();
  const [docs, setDocs] = useState<{ name: string; b64: string; reverse: boolean }[]>([]);
  const { busy, err, run } = useJob();
  const add = async () => {
    const picked = await pickPdfs(true);
    const next = [];
    for (const f of picked) next.push({ name: f.name, b64: await readBase64(f.uri), reverse: false });
    setDocs([...docs, ...next]);
  };
  return (
    <Screen>
      <Body dim>Pages are taken in turn from each file: A1, B1, A2, B2… Great for front and back scans.</Body>
      <Button variant="ghost" title="+ Add PDFs" onPress={add} />
      {docs.map((d, i) => (
        <Card key={d.name + i} style={{ gap: 8 }}>
          <Text numberOfLines={1} style={{ color: t.text }}>{i + 1}. {d.name}</Text>
          <Row>
            <View style={{ flex: 1 }}><Button variant={d.reverse ? "primary" : "ghost"} title={d.reverse ? "Reversed ✓" : "Reverse order"} onPress={() => setDocs(docs.map((x, k) => (k === i ? { ...x, reverse: !x.reverse } : x)))} /></View>
            <Button variant="ghost" title="✕" onPress={() => setDocs(docs.filter((_, k) => k !== i))} />
          </Row>
        </Card>
      ))}
      <ErrorText>{err}</ErrorText>
      <Button title="Alternate & mix" disabled={docs.length < 2} loading={busy} onPress={() => run(async () => pdf("mixed.pdf", await alternateMix(docs.map((d) => d.b64), docs.map((d) => d.reverse))))} />
    </Screen>
  );
}

export function SplitPdfHalf() {
  const [mode, setMode] = useState<"Down the middle" | "Across the middle">("Down the middle");
  const [rtl, setRtl] = useState(false);
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Chips options={["Down the middle", "Across the middle"] as const} value={mode} onChange={setMode} />
        <Button variant={rtl ? "primary" : "ghost"} title={rtl ? "Right-to-left order ✓" : "Reverse the order of the halves"} onPress={() => setRtl(!rtl)} />
        <ErrorText>{err}</ErrorText>
        <Button title={`Split every page in half (${d.pages * 2} pages)`} loading={busy} onPress={() => run(async () => pdf(outName(d.name, "-halves"), await splitInHalf(d.b64, mode === "Down the middle" ? "vertical" : "horizontal", rtl)))} />
      </>
    )}</PdfScreen>
  );
}

const SIZES = [["500 KB", 500 * 1024], ["1 MB", 1024 ** 2], ["2 MB", 2 * 1024 ** 2], ["5 MB", 5 * 1024 ** 2], ["10 MB", 10 * 1024 ** 2]] as const;
export function SplitPdfSize() {
  const [label, setLabel] = useState<string>("1 MB");
  const [info, setInfo] = useState("");
  const { busy, err, run } = useJob();
  const max = SIZES.find((s) => s[0] === label)![1];
  return (
    <PdfScreen>{(d) => (
      <>
        <Label>Each part at most</Label>
        <Chips options={SIZES.map((s) => s[0])} value={label} onChange={setLabel} />
        <ErrorText>{err}</ErrorText>
        <Button title={`Split into parts of ${label} or less`} loading={busy} onPress={() => run(async () => {
          const parts = await splitBySize(d.b64, max);
          setInfo(`${parts.length} part${parts.length === 1 ? "" : "s"}, largest ${fmtBytes(Math.max(...parts.map((p) => p.length)))}`);
          await shareBytes(outName(d.name, "-parts", "zip"), "application/zip", zipOf(parts.map((bytes, i) => ({ name: outName(d.name, `-part-${String(i + 1).padStart(2, "0")}`), bytes }))));
        })} />
        {info ? <Body dim>{info} (shared as one ZIP)</Body> : null}
      </>
    )}</PdfScreen>
  );
}

export function PdfToZip() {
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <ErrorText>{err}</ErrorText>
        <Button title={`Convert ${d.pages} pages to ZIP`} loading={busy} onPress={() => run(async () => {
          const pad = String(d.pages).length;
          const parts = await splitEveryPage(d.b64);
          await shareBytes(outName(d.name, "-pages", "zip"), "application/zip", zipOf(parts.map((bytes, i) => ({ name: `page-${String(i + 1).padStart(pad, "0")}.pdf`, bytes }))));
        })} />
      </>
    )}</PdfScreen>
  );
}

export function RotatePdf() {
  const [angle, setAngle] = useState<"90° right" | "180°" | "90° left">("90° right");
  const [which, setWhich] = useState<"All" | "Odd" | "Even" | "Choose">("All");
  const [custom, setCustom] = useState("");
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Label>Rotate</Label><Chips options={["90° right", "180°", "90° left"] as const} value={angle} onChange={setAngle} />
        <Label>Pages</Label><Chips options={["All", "Odd", "Even", "Choose"] as const} value={which} onChange={setWhich} />
        {which === "Choose" && <Field value={custom} onChangeText={setCustom} placeholder="e.g. 1-3, 5" keyboardType="numbers-and-punctuation" />}
        <ErrorText>{err}</ErrorText>
        <Button title="Rotate & share" loading={busy} disabled={which === "Choose" && !custom.trim()} onPress={() => run(async () => {
          const sel: PageSelect = which === "Choose" ? parseRanges(custom, d.pages) : (which.toLowerCase() as "all" | "odd" | "even");
          await pdf(outName(d.name, "-rotated"), await rotatePages(d.b64, angle === "180°" ? 180 : angle === "90° left" ? 270 : 90, sel));
        })} />
      </>
    )}</PdfScreen>
  );
}

export function FlipPdf() {
  const [axis, setAxis] = useState<"Left ↔ right" | "Top ↕ bottom">("Left ↔ right");
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Chips options={["Left ↔ right", "Top ↕ bottom"] as const} value={axis} onChange={setAxis} />
        <ErrorText>{err}</ErrorText>
        <Button title="Flip & share" loading={busy} onPress={() => run(async () => pdf(outName(d.name, "-flipped"), await flipPages(d.b64, axis === "Left ↔ right" ? "horizontal" : "vertical")))} />
      </>
    )}</PdfScreen>
  );
}

export function MultiplePagesPerSheet() {
  const [per, setPer] = useState("4");
  const [size, setSize] = useState<SheetSize>("A4");
  const [border, setBorder] = useState(true);
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Label>Pages per sheet</Label><Chips options={perSheetOptions.map(String)} value={per} onChange={setPer} />
        <Label>Paper size</Label><Chips options={Object.keys(sheetSizes) as SheetSize[]} value={size} onChange={setSize} />
        <Button variant={border ? "primary" : "ghost"} title={border ? "Borders on ✓" : "Borders off"} onPress={() => setBorder(!border)} />
        <ErrorText>{err}</ErrorText>
        <Button title={`Make ${Math.ceil(d.pages / +per)} sheet${Math.ceil(d.pages / +per) === 1 ? "" : "s"}`} loading={busy} onPress={() => run(async () => pdf(outName(d.name, `-${per}-per-sheet`), await nUp(d.b64, +per as 2 | 4 | 6 | 9 | 16, size, border)))} />
      </>
    )}</PdfScreen>
  );
}

export function CropResizePdf() {
  const [m, setM] = useState({ top: "0", right: "0", bottom: "0", left: "0" });
  const [unit, setUnit] = useState<"mm" | "pt">("mm");
  const [target, setTarget] = useState<SheetSize | "Keep size">("Keep size");
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Label>Trim margins</Label>
        <Row><View style={{ flex: 1 }}><Field label="Top" value={m.top} onChangeText={(v) => setM({ ...m, top: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Bottom" value={m.bottom} onChangeText={(v) => setM({ ...m, bottom: v })} keyboardType="decimal-pad" /></View></Row>
        <Row><View style={{ flex: 1 }}><Field label="Left" value={m.left} onChangeText={(v) => setM({ ...m, left: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Right" value={m.right} onChangeText={(v) => setM({ ...m, right: v })} keyboardType="decimal-pad" /></View></Row>
        <Chips options={["mm", "pt"] as const} value={unit} onChange={setUnit} />
        <Label>Fit pages to paper</Label><Chips options={["Keep size", ...Object.keys(sheetSizes)] as (SheetSize | "Keep size")[]} value={target} onChange={setTarget} />
        <ErrorText>{err}</ErrorText>
        <Button title="Apply & share" loading={busy} onPress={() => run(async () => pdf(outName(d.name, "-cropped"), await cropResize(d.b64, { top: +m.top || 0, right: +m.right || 0, bottom: +m.bottom || 0, left: +m.left || 0, unit, target: target === "Keep size" ? "none" : target })))} />
      </>
    )}</PdfScreen>
  );
}

const COLORS: Record<string, string> = { Gray: "#888888", Red: "#d62828", Blue: "#1d4ed8", Black: "#000000" };
export function WatermarkPdf() {
  const [text, setText] = useState("CONFIDENTIAL");
  const [size, setSize] = useState("48");
  const [opacity, setOpacity] = useState("25");
  const [angle, setAngle] = useState("45");
  const [color, setColor] = useState("Gray");
  const [tile, setTile] = useState(false);
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Field label="Watermark text" value={text} onChangeText={setText} maxLength={60} autoCapitalize="characters" />
        <Row>
          <View style={{ flex: 1 }}><Field label="Size" value={size} onChangeText={setSize} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Opacity %" value={opacity} onChangeText={setOpacity} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Angle °" value={angle} onChangeText={setAngle} keyboardType="number-pad" /></View>
        </Row>
        <Label>Colour</Label><Chips options={Object.keys(COLORS)} value={color} onChange={setColor} />
        <Button variant={tile ? "primary" : "ghost"} title={tile ? "Repeated across the page ✓" : "Repeat across the page"} onPress={() => setTile(!tile)} />
        <Body dim>Latin letters, numbers and common symbols are supported.</Body>
        <ErrorText>{err}</ErrorText>
        <Button title="Add watermark & share" loading={busy} disabled={!text.trim()} onPress={() => run(async () => pdf(outName(d.name, "-watermarked"), await addWatermark(d.b64, { text, size: Math.min(150, Math.max(8, +size || 48)), opacity: Math.min(1, Math.max(0.05, (+opacity || 25) / 100)), angle: Math.min(90, Math.max(0, +angle || 0)), color: COLORS[color], tile })))} />
      </>
    )}</PdfScreen>
  );
}

const FORMATS = ["{n}", "Page {n}", "Page {n} of {total}", "{n} / {total}", "- {n} -"];
export function AddPageNumbers() {
  const [format, setFormat] = useState("Page {n} of {total}");
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [start, setStart] = useState("1");
  const [skipFirst, setSkipFirst] = useState(false);
  const { busy, err, run } = useJob();
  return (
    <PdfScreen>{(d) => (
      <>
        <Field label="Format ({n} = number, {total} = page count)" value={format} onChangeText={setFormat} />
        <Chips options={FORMATS} value={format} onChange={setFormat} />
        <Label>Position</Label><Chips options={numberPositions} value={position} onChange={setPosition} />
        <Field label="Start at" value={start} onChangeText={setStart} keyboardType="number-pad" />
        <Button variant={skipFirst ? "primary" : "ghost"} title={skipFirst ? "Skipping the first page ✓" : "Skip the first page (cover)"} onPress={() => setSkipFirst(!skipFirst)} />
        <ErrorText>{err}</ErrorText>
        <Button title="Add page numbers" loading={busy} onPress={() => run(async () => pdf(outName(d.name, "-numbered"), await addPageNumbers(d.b64, { format, position, start: +start || 1, skipFirst })))} />
      </>
    )}</PdfScreen>
  );
}

const DETAIL_FIELDS: [keyof PdfDetails, string][] = [["title", "Title"], ["author", "Author"], ["subject", "Subject"], ["keywords", "Keywords (comma separated)"], ["creator", "Creator"], ["producer", "Producer"]];
export function EditPdfDetails() {
  const { doc, pick, err: pickErr } = usePdf();
  const [d, setD] = useState<PdfDetails>({});
  const { busy, err, run } = useJob();
  const choose = async () => { await pick(); };
  // load the details whenever a (new) document is chosen
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (doc && loadedFor !== doc.b64.slice(0, 64) + doc.name) { setLoadedFor(doc.b64.slice(0, 64) + doc.name); readDetails(doc.b64).then(setD).catch(() => {}); }
  return (
    <Screen>
      <Body dim>See and change the hidden information inside a PDF.</Body>
      <Button variant="ghost" title={doc ? "Choose another PDF" : "Choose a PDF"} onPress={choose} />
      <ErrorText>{pickErr}</ErrorText>
      {doc && (
        <>
          {DETAIL_FIELDS.map(([k, label]) => <Field key={k} label={label} value={d[k] ?? ""} onChangeText={(v) => setD({ ...d, [k]: v })} autoCapitalize="sentences" />)}
          <ErrorText>{err}</ErrorText>
          <Button title="Save details & share" loading={busy} onPress={() => run(async () => pdf(outName(doc.name, "-edited"), await setDetails(doc.b64, d)))} />
          <Button variant="ghost" title="Remove all details (privacy)" disabled={busy} onPress={() => run(async () => pdf(outName(doc.name, "-clean"), await setDetails(doc.b64, {})))} />
        </>
      )}
    </Screen>
  );
}

type Shot = { uri: string; rot: number };
export function ScanToPdf() {
  const t = useTheme();
  const [shots, setShots] = useState<Shot[]>([]);
  const [a4, setA4] = useState(true);
  const { busy, err, run } = useJob();
  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error("Camera permission is needed to scan. You can still choose photos from your library.");
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!r.canceled) setShots((s) => [...s, ...r.assets.map((a) => ({ uri: a.uri, rot: 0 }))]);
  };
  const build = () => run(async () => {
    const pages = [];
    for (const s of shots) {
      const r = await manipulateAsync(s.uri, s.rot ? [{ rotate: s.rot * 90 }] : [], { format: SaveFormat.JPEG, compress: 0.85, base64: true });
      pages.push({ b64: r.base64 ?? "", w: r.width, h: r.height });
    }
    await pdf("scan.pdf", await buildScanPdf(pages, a4));
  });
  return (
    <Screen>
      <Body dim>Take photos of your pages, or choose existing ones, and turn them into one PDF.</Body>
      <Row>
        <View style={{ flex: 1 }}><Button title="📷 Scan a page" onPress={() => run(camera)} /></View>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Choose photos" onPress={async () => { const a = await pickImages(true); setShots((s) => [...s, ...a.map((x) => ({ uri: x.uri, rot: 0 }))]); }} /></View>
      </Row>
      {shots.map((s, i) => (
        <Card key={s.uri + i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={{ uri: s.uri }} resizeMode="cover" style={{ width: 64, height: 64, borderRadius: 8, transform: [{ rotate: `${s.rot * 90}deg` }] }} />
          <Text style={{ color: t.text, flex: 1 }}>Page {i + 1}</Text>
          <Button variant="ghost" title="⟳" onPress={() => setShots(shots.map((x, k) => (k === i ? { ...x, rot: (x.rot + 1) % 4 } : x)))} />
          <Button variant="ghost" title="✕" onPress={() => setShots(shots.filter((_, k) => k !== i))} />
        </Card>
      ))}
      <Button variant={a4 ? "primary" : "ghost"} title={a4 ? "Fit each page on A4 ✓" : "Fit each page on A4"} onPress={() => setA4(!a4)} />
      <ErrorText>{err}</ErrorText>
      <Button title={`Create PDF (${shots.length} page${shots.length === 1 ? "" : "s"})`} disabled={!shots.length} loading={busy} onPress={build} />
    </Screen>
  );
}
