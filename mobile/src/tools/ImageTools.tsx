import { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Body, Button, Card, Chips, ErrorText, Field, Label, Row, Screen } from "@/components/ui";
import { fileSize, fmtBytes, pickImages, shareUri } from "@/lib/files";
import { useTheme } from "@/theme";

type Pic = { uri: string; width: number; height: number; name: string; size: number };

async function pickOne(): Promise<Pic | null> {
  const [a] = await pickImages(false);
  return a ? { uri: a.uri, width: a.width, height: a.height, name: a.fileName ?? "photo", size: a.fileSize ?? (await fileSize(a.uri)) } : null;
}

function Preview({ pic }: { pic: Pic }) {
  const t = useTheme();
  return (
    <Card>
      <Image source={{ uri: pic.uri }} resizeMode="contain" style={{ width: "100%", height: 200, borderRadius: 10 }} />
      <Text style={{ color: t.sub, fontSize: 13 }}>{pic.name} · {pic.width}×{pic.height}px · {fmtBytes(pic.size)}</Text>
    </Card>
  );
}

const PRESETS = [20, 50, 100, 200, 500];

/** Finds the highest JPEG quality that fits the target, shrinking the image if even the lowest quality is too big. */
async function compressToTarget(pic: Pic, targetBytes: number): Promise<{ uri: string; size: number }> {
  let width = pic.width;
  for (let attempt = 0; attempt < 6; attempt++) {
    let lo = 0.05, hi = 0.95, best: { uri: string; size: number } | null = null;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const r = await manipulateAsync(pic.uri, width < pic.width ? [{ resize: { width } }] : [], { compress: q, format: SaveFormat.JPEG });
      const size = await fileSize(r.uri);
      if (size <= targetBytes) { best = { uri: r.uri, size }; lo = q; } else hi = q;
    }
    if (best) return best;
    width = Math.round(width * 0.8);
  }
  throw new Error("Could not reach that size.");
}

export function CompressImage() {
  const [pic, setPic] = useState<Pic | null>(null);
  const [kb, setKb] = useState("100");
  const [out, setOut] = useState<{ uri: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true); setErr(""); setOut(null);
    try { setOut(await compressToTarget(pic!, Math.max(5, parseInt(kb, 10) || 100) * 1024)); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title={pic ? "Choose another photo" : "Choose a photo"} onPress={async () => { const p = await pickOne(); if (p) { setPic(p); setOut(null); } }} />
      {pic && (
        <>
          <Preview pic={pic} />
          <Label>Target size (KB)</Label>
          <Chips options={PRESETS.map(String)} value={kb} onChange={setKb} />
          <Field value={kb} onChangeText={setKb} keyboardType="number-pad" />
          <Button title={`Compress to ${kb} KB`} loading={busy} onPress={run} />
          <ErrorText>{err}</ErrorText>
          {out && (
            <Card>
              <Body>Result: <Text style={{ fontWeight: "800" }}>{fmtBytes(out.size)}</Text></Body>
              <Button title="Save / share" onPress={() => shareUri(out.uri, "image/jpeg", "compressed.jpg").catch((e) => setErr(e.message))} />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const SIZE_PRESETS = [
  { label: "Passport 35×45 mm (413×531)", w: 413, h: 531 },
  { label: "Exam photo (200×230)", w: 200, h: 230 },
  { label: "Signature (140×60)", w: 140, h: 60 },
  { label: "Instagram square (1080)", w: 1080, h: 1080 },
];

export function ResizeImage() {
  const [pic, setPic] = useState<Pic | null>(null);
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const load = async () => { const p = await pickOne(); if (p) { setPic(p); setW(String(p.width)); setH(String(p.height)); } };
  const run = async () => {
    setBusy(true); setErr("");
    try {
      const r = await manipulateAsync(pic!.uri, [{ resize: { width: parseInt(w, 10), height: parseInt(h, 10) } }], { compress: 0.92, format: SaveFormat.JPEG });
      await shareUri(r.uri, "image/jpeg", "resized.jpg");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title={pic ? "Choose another photo" : "Choose a photo"} onPress={load} />
      {pic && (
        <>
          <Preview pic={pic} />
          <View style={{ gap: 8 }}>
            {SIZE_PRESETS.map((p) => <Button key={p.label} variant="ghost" title={p.label} onPress={() => { setW(String(p.w)); setH(String(p.h)); }} />)}
          </View>
          <Row>
            <View style={{ flex: 1 }}><Field label="Width (px)" value={w} onChangeText={setW} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Height (px)" value={h} onChangeText={setH} keyboardType="number-pad" /></View>
          </Row>
          <ErrorText>{err}</ErrorText>
          <Button title="Resize & share" disabled={!parseInt(w, 10) || !parseInt(h, 10)} loading={busy} onPress={run} />
        </>
      )}
    </Screen>
  );
}

export function ImageConverter() {
  const formats = (Platform.OS === "android" ? ["JPG", "PNG", "WebP"] : ["JPG", "PNG"]) as readonly string[];
  const [pic, setPic] = useState<Pic | null>(null);
  const [fmt, setFmt] = useState("JPG");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true); setErr("");
    try {
      const format = fmt === "PNG" ? SaveFormat.PNG : fmt === "WebP" ? SaveFormat.WEBP : SaveFormat.JPEG;
      const r = await manipulateAsync(pic!.uri, [], { compress: 0.92, format });
      await shareUri(r.uri, format === SaveFormat.PNG ? "image/png" : format === SaveFormat.WEBP ? "image/webp" : "image/jpeg", `converted.${fmt.toLowerCase().replace("jpg", "jpg")}`);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title={pic ? "Choose another photo" : "Choose a photo"} onPress={async () => { const p = await pickOne(); if (p) setPic(p); }} />
      {pic && (
        <>
          <Preview pic={pic} />
          <Label>Convert to</Label>
          <Chips options={formats} value={fmt} onChange={setFmt} />
          <ErrorText>{err}</ErrorText>
          <Button title={`Convert to ${fmt} & share`} loading={busy} onPress={run} />
        </>
      )}
    </Screen>
  );
}

/** iPhone photos are converted by the phone itself; this is the image converter with JPG preselected. */
export function HeicToJpg() { return <ImageConverter />; }
