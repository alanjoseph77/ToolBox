import { useMemo, useRef, useState } from "react";
import { Image, PanResponder, Platform, Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import QRCode from "react-native-qrcode-svg";
import Svg, { Path } from "react-native-svg";
import { Body, Button, Card, Chips, ErrorText, Field, Label, Output, Row, Screen } from "@/components/ui";
import { base64ToBytes, fileSize, fmtBytes, outName, pickImages, pickPdfs, readBase64, shareBase64, shareBytes, shareUri } from "@/lib/files";
import { amortization, emi, gst, inr } from "@/lib/calc";
import { cases } from "@/lib/textCase";
import { md5 } from "@/lib/hash";
import { buildUpiLink } from "@/lib/upi";
import { fillForm, listFields, type FormField, type FormValues } from "@/lib/pdfForms";
import { makeZip } from "@/lib/zip";
import { useTheme } from "@/theme";

const utf8 = (s: string) => Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));

// ---------- calculators ----------
export function EmiCalculator() {
  const t = useTheme();
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const months = Math.round((+tenure || 0) * (unit === "years" ? 12 : 1));
  const res = useMemo(() => { try { return emi(+amount, +rate || 0, months); } catch { return null; } }, [amount, rate, months]);
  const yearly = useMemo(() => {
    if (!res) return [];
    const out: { year: number; principal: number; interest: number; balance: number }[] = [];
    amortization(+amount, +rate || 0, months).forEach((r) => { const y = Math.ceil(r.month / 12); const o = out[y - 1] ?? (out[y - 1] = { year: y, principal: 0, interest: 0, balance: 0 }); o.principal += r.principal; o.interest += r.interest; o.balance = r.balance; });
    return out;
  }, [res, amount, rate, months]);
  return (
    <Screen>
      <Field label="Loan amount (₹)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Field label="Interest rate (% a year)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" />
      <Field label="Tenure" value={tenure} onChangeText={setTenure} keyboardType="number-pad" />
      <Chips options={["years", "months"] as const} value={unit} onChange={setUnit} />
      {res ? (
        <>
          <Card style={{ alignItems: "center" }}>
            <Text style={{ color: t.sub, fontSize: 12, fontWeight: "700" }}>YOUR MONTHLY EMI</Text>
            <Text style={{ color: t.text, fontSize: 38, fontWeight: "800" }}>{inr(res.emi)}</Text>
          </Card>
          {([["Principal", inr(+amount)], ["Total interest", inr(res.totalInterest)], ["Total payment", inr(res.totalPayment)]] as const).map(([k, v]) => (
            <Card key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: t.sub }}>{k}</Text><Text style={{ color: t.text, fontWeight: "700" }}>{v}</Text></Card>
          ))}
          <Label>Year by year</Label>
          {yearly.map((y) => (
            <Card key={y.year} style={{ gap: 2 }}>
              <Text style={{ color: t.text, fontWeight: "700" }}>Year {y.year}</Text>
              <Text style={{ color: t.sub, fontSize: 13 }}>Principal {inr(y.principal)} · Interest {inr(y.interest)} · Balance {inr(y.balance)}</Text>
            </Card>
          ))}
        </>
      ) : <Body dim>Enter a loan amount, rate and tenure.</Body>}
    </Screen>
  );
}

const GST_RATES = ["0", "3", "5", "12", "18", "28"];
export function GstCalculator() {
  const t = useTheme();
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("18");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"Add GST" | "Remove GST">("Add GST");
  const r = custom.trim() ? +custom : +rate;
  const res = Number.isFinite(r) && r >= 0 ? gst(+amount || 0, r, mode === "Add GST" ? "exclusive" : "inclusive") : null;
  const rows: [string, number][] = res ? [["Amount before GST", res.base], [`CGST (${r / 2}%)`, res.cgst], [`SGST (${r / 2}%)`, res.sgst], [`Total GST (${r}%)`, res.gst], ["Total amount", res.total]] : [];
  return (
    <Screen>
      <Chips options={["Add GST", "Remove GST"] as const} value={mode} onChange={setMode} />
      <Field label={mode === "Add GST" ? "Amount before GST (₹)" : "Amount including GST (₹)"} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Label>GST rate</Label>
      <Chips options={GST_RATES} value={custom.trim() ? "" : rate} onChange={(v) => { setRate(v); setCustom(""); }} />
      <Field label="Custom rate %" value={custom} onChangeText={setCustom} keyboardType="decimal-pad" />
      {rows.map(([k, v], i) => (
        <Card key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: i === rows.length - 1 ? t.text : t.sub, fontWeight: i === rows.length - 1 ? "800" : "400" }}>{k}</Text>
          <Text selectable style={{ color: t.text, fontWeight: "700" }}>{inr(v, 2)}</Text>
        </Card>
      ))}
    </Screen>
  );
}

// ---------- developer ----------
const SHAS: [string, Crypto.CryptoDigestAlgorithm][] = [["SHA-1", Crypto.CryptoDigestAlgorithm.SHA1], ["SHA-256", Crypto.CryptoDigestAlgorithm.SHA256], ["SHA-384", Crypto.CryptoDigestAlgorithm.SHA384], ["SHA-512", Crypto.CryptoDigestAlgorithm.SHA512]];
export function HashGenerator() {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<[string, string][]>([]);
  const [expected, setExpected] = useState("");
  const compute = async (v: string) => {
    setText(v);
    const sha = await Promise.all(SHAS.map(async ([n, a]) => [n, await Crypto.digestStringAsync(a, v)] as [string, string]));
    setHashes([["MD5", md5(utf8(v))], ...sha]);
  };
  const exp = expected.trim().toLowerCase();
  const match = exp ? hashes.find(([, h]) => h === exp)?.[0] : undefined;
  return (
    <Screen>
      <Field mono multiline value={text} onChangeText={compute} placeholder="Type or paste text…" />
      {hashes.map(([n, h]) => <View key={n} style={{ gap: 4 }}><Label>{n}</Label><Output value={h} /></View>)}
      <Field mono label="Compare with a hash you were given" value={expected} onChangeText={setExpected} placeholder="Paste the expected hash" />
      {exp ? <Body>{match ? `✓ Match (${match})` : "✗ No match"}</Body> : null}
    </Screen>
  );
}

export function TextCaseConverter() {
  const [text, setText] = useState("");
  const names = Object.keys(cases);
  const [active, setActive] = useState("Title Case");
  const out = text ? cases[active](text) : "";
  return (
    <Screen>
      <Field multiline value={text} onChangeText={setText} placeholder="Type or paste your text…" autoCapitalize="sentences" autoCorrect />
      <Chips options={names} value={active} onChange={setActive} />
      <Output value={out} mono={false} />
    </Screen>
  );
}

// ---------- payments ----------
export function UpiQrGenerator() {
  const [vpa, setVpa] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const ref = useRef<{ toDataURL: (cb: (d: string) => void) => void } | null>(null);
  let link = "", err = "";
  if (vpa.trim()) { try { link = buildUpiLink({ vpa, name, amount, note }); } catch (e) { err = (e as Error).message; } }
  return (
    <Screen>
      <Field label="UPI ID *" value={vpa} onChangeText={setVpa} placeholder="yourname@okbank" />
      <Field label="Name (optional)" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label="Amount ₹ (optional)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Note (optional)" value={note} onChangeText={setNote} maxLength={50} autoCapitalize="sentences" />
      <ErrorText>{err || saveErr}</ErrorText>
      {link ? (
        <>
          <Card style={{ alignItems: "center", backgroundColor: "#fff" }}><QRCode value={link} size={240} color="#000" backgroundColor="#fff" getRef={(c) => { ref.current = c; }} /></Card>
          <Button title="Save / share QR (PNG)" onPress={() => { setSaveErr(""); ref.current?.toDataURL(async (b64) => { try { await shareBase64("upi-qr.png", "image/png", b64); } catch (e) { setSaveErr((e as Error).message); } }); }} />
          <Output value={link} />
        </>
      ) : <Body dim>Enter your UPI ID to create your QR code.</Body>}
      <Body dim>Works with every UPI app. Make a ₹1 test payment before printing.</Body>
    </Screen>
  );
}

// ---------- images ----------
type Pt = { x: number; y: number };
const INKS: Record<string, string> = { Black: "#111111", Blue: "#1d3fbb", "Dark blue": "#0b1f5c" };
const toPath = (s: Pt[]) => s.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + (s.length === 1 ? ` L${s[0].x + 0.1} ${s[0].y}` : "");

export function SignatureMaker() {
  const t = useTheme();
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [ink, setInk] = useState("Black");
  const [err, setErr] = useState("");
  const exportRef = useRef<{ toDataURL: (cb: (d: string) => void) => void } | null>(null);
  const current = useRef<Pt[] | null>(null);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { current.current = [{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]; setStrokes((s) => [...s, current.current!]); },
    onPanResponderMove: (e) => { if (!current.current) return; current.current.push({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }); setStrokes((s) => [...s.slice(0, -1), [...current.current!]]); },
    onPanResponderRelease: () => { current.current = null; },
  }), []);
  const pts = strokes.flat();
  const pad = 14;
  const box = pts.length ? { x: Math.min(...pts.map((p) => p.x)) - pad, y: Math.min(...pts.map((p) => p.y)) - pad, w: Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)) + 2 * pad, h: Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y)) + 2 * pad } : null;
  const paths = strokes.map((s, i) => <Path key={i} d={toPath(s)} stroke={INKS[ink]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
  const save = () => { setErr(""); exportRef.current?.toDataURL(async (b64) => { try { await shareBase64("signature.png", "image/png", b64); } catch (e) { setErr((e as Error).message); } }); };
  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: t.bg }}>
      <Body dim>Sign inside the box with your finger.</Body>
      <View {...responder.panHandlers} style={{ height: 240, borderWidth: 1, borderColor: t.border, borderRadius: 16, backgroundColor: "#fff", overflow: "hidden" }}>
        <Svg width="100%" height="100%" pointerEvents="none">{paths}</Svg>
      </View>
      <Chips options={Object.keys(INKS)} value={ink} onChange={setInk} />
      <Row>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Undo" disabled={!strokes.length} onPress={() => setStrokes(strokes.slice(0, -1))} /></View>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Clear" disabled={!strokes.length} onPress={() => setStrokes([])} /></View>
      </Row>
      <ErrorText>{err}</ErrorText>
      <Button title="Save transparent PNG" disabled={!box} onPress={save} />
      <Body dim>The PNG is cropped to your signature and has a transparent background.</Body>
      {/* hidden, tightly cropped copy that gets exported */}
      {box && <View style={{ position: "absolute", opacity: 0, left: -9999 }} pointerEvents="none"><Svg width={Math.round(box.w * 2)} height={Math.round(box.h * 2)} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} ref={(r) => { exportRef.current = r as unknown as typeof exportRef.current; }}>{paths}</Svg></View>}
    </View>
  );
}

export function RemovePhotoDetails() {
  const t = useTheme();
  const [items, setItems] = useState<{ name: string; gps: string; camera: string; date: string; has: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setErr(""); setBusy(true);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 1, exif: true });
      if (picked.canceled) { setBusy(false); return; }
      const infos: typeof items = [], files: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < picked.assets.length; i++) {
        const a = picked.assets[i], ex = (a.exif ?? {}) as Record<string, unknown>;
        const lat = ex.GPSLatitude, lon = ex.GPSLongitude;
        infos.push({ name: a.fileName ?? `Photo ${i + 1}`, gps: typeof lat === "number" && typeof lon === "number" ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "", camera: [ex.Make, ex.Model].filter(Boolean).join(" "), date: String(ex.DateTimeOriginal ?? ""), has: Object.keys(ex).length > 0 });
        // re-encoding drops every hidden tag
        const r = await manipulateAsync(a.uri, [], { format: SaveFormat.JPEG, compress: 0.95 });
        files.push({ name: outName(a.fileName ?? `photo-${i + 1}.jpg`, "-clean", "jpg"), bytes: base64ToBytes(await readBase64(r.uri)) });
      }
      setItems(infos);
      if (files.length === 1) await shareBytes(files[0].name, "image/jpeg", files[0].bytes);
      else await shareBytes("clean-photos.zip", "application/zip", makeZip(files.map((f) => ({ name: f.name, data: f.bytes }))));
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Body dim>Photos can secretly contain where and when they were taken. Choose photos to see what they hide and share clean copies.</Body>
      <Button title="Choose photos" loading={busy} onPress={run} />
      <ErrorText>{err}</ErrorText>
      {items.map((i) => (
        <Card key={i.name} style={{ gap: 2 }}>
          <Text style={{ color: t.text, fontWeight: "700" }}>{i.name}</Text>
          {i.has ? <>
            {i.gps ? <Text style={{ color: t.danger, fontWeight: "700" }}>Location was stored: {i.gps}</Text> : null}
            {i.camera ? <Text style={{ color: t.sub }}>Camera: {i.camera}</Text> : null}
            {i.date ? <Text style={{ color: t.sub }}>Taken: {i.date}</Text> : null}
          </> : <Text style={{ color: t.sub }}>No hidden details found.</Text>}
          <Text style={{ color: t.sub, fontSize: 12 }}>The shared copy has all of this removed.</Text>
        </Card>
      ))}
    </Screen>
  );
}

export function FillPdfForm() {
  const [name, setName] = useState("");
  const [b64, setB64] = useState("");
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async () => {
    setErr("");
    const [f] = await pickPdfs(false); if (!f) return;
    try { const data = await readBase64(f.uri); const l = await listFields(data); setName(f.name); setB64(data); setFields(l); setValues(Object.fromEntries(l.map((x) => [x.name, x.value]))); }
    catch { setErr("That file is not a valid PDF (or it is password protected)."); }
  };
  const set = (k: string, v: string | boolean) => setValues((s) => ({ ...s, [k]: v }));
  const save = async () => { setBusy(true); setErr(""); try { await shareBytes(outName(name, "-filled"), "application/pdf", await fillForm(b64, values, flatten)); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  return (
    <Screen>
      <Button variant="ghost" title={name ? "Choose another PDF" : "Choose a PDF form"} onPress={pick} />
      <ErrorText>{err}</ErrorText>
      {fields && !fields.length ? <Body>This PDF has no fillable fields. Try Sign PDF or Add Watermark instead.</Body> : null}
      {fields && fields.length > 0 && (
        <>
          <Body dim>{fields.length} fillable field{fields.length === 1 ? "" : "s"}</Body>
          {fields.map((x) => x.kind === "checkbox"
            ? <Button key={x.name} variant={values[x.name] ? "primary" : "ghost"} title={`${values[x.name] ? "☑" : "☐"} ${x.name}`} onPress={() => set(x.name, !values[x.name])} />
            : x.kind === "text"
              ? <Field key={x.name} label={x.name} multiline={x.multiline} value={String(values[x.name] ?? "")} onChangeText={(v) => set(x.name, v)} autoCapitalize="sentences" />
              : <View key={x.name} style={{ gap: 6 }}><Label>{x.name}</Label><Chips options={x.options ?? []} value={String(values[x.name] ?? "")} onChange={(v) => set(x.name, v)} /></View>)}
          <Button variant={flatten ? "primary" : "ghost"} title={flatten ? "Answers will be locked ✓" : "Lock the answers (flatten)"} onPress={() => setFlatten(!flatten)} />
          <Button title="Save filled PDF" loading={busy} onPress={save} />
        </>
      )}
    </Screen>
  );
}

// ---------- image pipeline ----------
type Pic = { uri: string; width: number; height: number; name: string };
const PRESETS = [{ label: "Passport 413×531", w: 413, h: 531 }, { label: "Exam photo 200×230", w: 200, h: 230 }, { label: "Signature 140×60", w: 140, h: 60 }];
export function ImagePipeline() {
  const t = useTheme();
  const formats = (Platform.OS === "android" ? ["JPG", "PNG", "WebP"] : ["JPG", "PNG"]) as readonly string[];
  const [pics, setPics] = useState<Pic[]>([]);
  const [resizeOn, setResizeOn] = useState(true);
  const [mode, setMode] = useState<"Fit inside" | "Exact size">("Fit inside");
  const [w, setW] = useState("1080");
  const [h, setH] = useState("1080");
  const [fmt, setFmt] = useState("JPG");
  const [compressOn, setCompressOn] = useState(true);
  const [kb, setKb] = useState("100");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const one = async (p: Pic) => {
    const format = fmt === "PNG" ? SaveFormat.PNG : fmt === "WebP" ? SaveFormat.WEBP : SaveFormat.JPEG;
    const targetW = mode === "Exact size" ? (+w || p.width) : Math.round(p.width * Math.min(1, (+w || Infinity) / p.width, (+h || Infinity) / p.height));
    const targetH = mode === "Exact size" ? (+h || p.height) : Math.round(p.height * Math.min(1, (+w || Infinity) / p.width, (+h || Infinity) / p.height));
    const acts = (scale: number) => (resizeOn || scale < 1 ? [{ resize: { width: Math.round((resizeOn ? targetW : p.width) * scale), height: Math.round((resizeOn ? targetH : p.height) * scale) } }] : []);
    if (!compressOn || fmt === "PNG") { const r = await manipulateAsync(p.uri, acts(1), { format, compress: 0.92 }); return { uri: r.uri, size: await fileSize(r.uri), w: r.width, h: r.height }; }
    const target = Math.max(5, +kb || 100) * 1024;
    let scale = 1;
    for (let attempt = 0; attempt < 6; attempt++) {
      let lo = 0.05, hi = 0.95, best: { uri: string; size: number; w: number; h: number } | null = null;
      for (let i = 0; i < 7; i++) { const q = (lo + hi) / 2; const r = await manipulateAsync(p.uri, acts(scale), { format, compress: q }); const size = await fileSize(r.uri); if (size <= target) { best = { uri: r.uri, size, w: r.width, h: r.height }; lo = q; } else hi = q; }
      if (best) return best;
      scale *= 0.85;
    }
    throw new Error("Could not reach that size.");
  };
  const run = async () => {
    setBusy(true); setErr(""); setLog([]);
    try {
      const ext = fmt === "PNG" ? "png" : fmt === "WebP" ? "webp" : "jpg", mime = fmt === "PNG" ? "image/png" : fmt === "WebP" ? "image/webp" : "image/jpeg";
      const files: { name: string; data: Uint8Array }[] = [], lines: string[] = [];
      for (const p of pics) { const r = await one(p); lines.push(`${p.name} → ${r.w}×${r.h}px · ${fmtBytes(r.size)}`); files.push({ name: outName(p.name, "-processed", ext), data: base64ToBytes(await readBase64(r.uri)) }); }
      setLog(lines);
      if (files.length === 1) await shareBytes(files[0].name, mime, files[0].data); else await shareBytes("processed-photos.zip", "application/zip", makeZip(files));
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Body dim>Resize, convert and compress many photos in one go, without saving between steps.</Body>
      <Button variant="ghost" title="+ Add photos" onPress={async () => setPics([...pics, ...(await pickImages(true)).map((a, i) => ({ uri: a.uri, width: a.width, height: a.height, name: a.fileName ?? `photo-${pics.length + i + 1}.jpg` }))])} />
      {pics.map((p, i) => (
        <Card key={p.uri + i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={{ uri: p.uri }} style={{ width: 48, height: 48, borderRadius: 8 }} />
          <Text numberOfLines={1} style={{ color: t.text, flex: 1 }}>{p.name} · {p.width}×{p.height}</Text>
          <Button variant="ghost" title="✕" onPress={() => setPics(pics.filter((_, k) => k !== i))} />
        </Card>
      ))}
      {pics.length > 0 && (
        <>
          <Card>
            <Button variant={resizeOn ? "primary" : "ghost"} title={resizeOn ? "1  Resize ✓" : "1  Resize (off)"} onPress={() => setResizeOn(!resizeOn)} />
            {resizeOn && <>
              {PRESETS.map((p) => <Button key={p.label} variant="ghost" title={p.label} onPress={() => { setMode("Exact size"); setW(String(p.w)); setH(String(p.h)); }} />)}
              <Chips options={["Fit inside", "Exact size"] as const} value={mode} onChange={setMode} />
              <Row><View style={{ flex: 1 }}><Field label="Width px" value={w} onChangeText={setW} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Height px" value={h} onChangeText={setH} keyboardType="number-pad" /></View></Row>
            </>}
          </Card>
          <Card><Label>2  Convert to</Label><Chips options={formats} value={fmt} onChange={setFmt} /></Card>
          <Card>
            <Button variant={compressOn ? "primary" : "ghost"} title={compressOn ? "3  Compress to a size ✓" : "3  Compress (off)"} onPress={() => setCompressOn(!compressOn)} />
            {compressOn && <><Chips options={["20", "50", "100", "200", "500"]} value={kb} onChange={setKb} /><Field label="Target KB" value={kb} onChangeText={setKb} keyboardType="number-pad" />{fmt === "PNG" && <Body dim>PNG can&apos;t be squeezed to a size. Pick JPG or WebP.</Body>}</>}
          </Card>
          <ErrorText>{err}</ErrorText>
          <Button title={`Run on ${pics.length} photo${pics.length === 1 ? "" : "s"}`} loading={busy} onPress={run} />
          {log.map((l) => <Body key={l} dim>{l}</Body>)}
        </>
      )}
    </Screen>
  );
}
