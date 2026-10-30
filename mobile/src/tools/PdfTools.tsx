import { useState } from "react";
import { Text, View } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Body, Button, Card, ErrorText, Field, Row, Screen } from "@/components/ui";
import { fmtBytes, pickImages, pickPdfs, readBase64, shareBase64 } from "@/lib/files";
import { extractPages, jpegsToPdf, mergePdfs, pageCount, parseRanges } from "@/lib/pdf";
import { useTheme } from "@/theme";

type Doc = { uri: string; name: string; size?: number };

export function MergePdf() {
  const t = useTheme();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= docs.length) return;
    const n = [...docs]; [n[i], n[j]] = [n[j], n[i]]; setDocs(n);
  };
  const merge = async () => {
    setBusy(true); setErr("");
    try { await shareBase64("merged.pdf", "application/pdf", await mergePdfs(await Promise.all(docs.map((d) => readBase64(d.uri))))); }
    catch { setErr("One of the files could not be read. Make sure all are valid, unprotected PDFs."); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title="+ Add PDFs" onPress={async () => setDocs([...docs, ...(await pickPdfs(true))])} />
      {docs.map((d, i) => (
        <Card key={d.uri + i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, color: t.text }}>{i + 1}. {d.name}{d.size ? `  (${fmtBytes(d.size)})` : ""}</Text>
          <Button variant="ghost" title="↑" onPress={() => move(i, -1)} />
          <Button variant="ghost" title="↓" onPress={() => move(i, 1)} />
          <Button variant="ghost" title="✕" onPress={() => setDocs(docs.filter((_, k) => k !== i))} />
        </Card>
      ))}
      <ErrorText>{err}</ErrorText>
      <Button title={`Merge ${docs.length || ""} PDFs`} disabled={docs.length < 2} loading={busy} onPress={merge} />
    </Screen>
  );
}

export function SplitPdf() {
  const [doc, setDoc] = useState<(Doc & { b64: string; pages: number }) | null>(null);
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async () => {
    setErr("");
    const [f] = await pickPdfs(false); if (!f) return;
    try { const b64 = await readBase64(f.uri); setDoc({ uri: f.uri, name: f.name, b64, pages: await pageCount(b64) }); }
    catch { setErr("That file is not a valid PDF."); }
  };
  const extract = async () => {
    setBusy(true); setErr("");
    try { await shareBase64("extracted.pdf", "application/pdf", await extractPages(doc!.b64, parseRanges(ranges, doc!.pages))); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const everyPage = async () => {
    setBusy(true); setErr("");
    try { for (let i = 0; i < doc!.pages; i++) await shareBase64(`page-${i + 1}.pdf`, "application/pdf", await extractPages(doc!.b64, [i])); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title={doc ? "Choose another PDF" : "Choose a PDF"} onPress={pick} />
      {doc && (
        <>
          <Body>{doc.name} · {doc.pages} pages</Body>
          <Field label="Pages to extract (e.g. 1-3, 5, 8-10)" value={ranges} onChangeText={setRanges} placeholder="1-3, 5" keyboardType="numbers-and-punctuation" />
          <Row>
            <View style={{ flex: 1 }}><Button title="Extract pages" loading={busy} onPress={extract} /></View>
            <View style={{ flex: 1 }}><Button variant="ghost" title="Split every page" disabled={busy} onPress={everyPage} /></View>
          </Row>
        </>
      )}
      <ErrorText>{err}</ErrorText>
    </Screen>
  );
}

export function JpgToPdf() {
  const t = useTheme();
  const [imgs, setImgs] = useState<{ uri: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const build = async () => {
    setBusy(true); setErr("");
    try {
      // Re-encode every image as JPEG first so HEIC, WebP and PNG all work.
      const jpegs: string[] = [];
      for (const i of imgs) jpegs.push((await manipulateAsync(i.uri, [], { format: SaveFormat.JPEG, compress: 0.92, base64: true })).base64 ?? "");
      await shareBase64("images.pdf", "application/pdf", await jpegsToPdf(jpegs));
    } catch { setErr("Could not create the PDF from these images."); }
    setBusy(false);
  };
  return (
    <Screen>
      <Button variant="ghost" title="+ Add photos" onPress={async () => setImgs([...imgs, ...(await pickImages(true)).map((a, k) => ({ uri: a.uri, name: a.fileName ?? `Image ${imgs.length + k + 1}` }))])} />
      {imgs.map((i, k) => (
        <Card key={i.uri + k} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, color: t.text }}>{k + 1}. {i.name}</Text>
          <Button variant="ghost" title="✕" onPress={() => setImgs(imgs.filter((_, x) => x !== k))} />
        </Card>
      ))}
      <ErrorText>{err}</ErrorText>
      <Button title="Create PDF" disabled={!imgs.length} loading={busy} onPress={build} />
    </Screen>
  );
}
