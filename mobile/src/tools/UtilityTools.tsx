import { useRef, useState } from "react";
import { Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import QRCode from "react-native-qrcode-svg";
import { Body, Button, Card, Chips, ErrorText, Field, Label, Output, Row, Screen } from "@/components/ui";
import { shareBase64 } from "@/lib/files";
import { convertUnit, makePassword, unitTables, wordStats, type PasswordOptions } from "@/lib/text";
import { useTheme } from "@/theme";

export function WordCounter() {
  const t = useTheme();
  const [text, setText] = useState("");
  const st = wordStats(text);
  const stats: [string, string | number][] = [["Words", st.words], ["Characters", st.characters], ["No spaces", st.noSpaces], ["Sentences", st.sentences], ["Paragraphs", st.paragraphs], ["Reading time", `${st.readingMinutes} min`]];
  return (
    <Screen>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {stats.map(([k, v]) => (
          <Card key={k} style={{ width: "48%", padding: 12, gap: 2 }}>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: "800" }}>{v}</Text>
            <Text style={{ color: t.sub, fontSize: 12 }}>{k}</Text>
          </Card>
        ))}
      </View>
      <Field multiline value={text} onChangeText={setText} placeholder="Type or paste your text…" autoCapitalize="sentences" autoCorrect />
    </Screen>
  );
}

export function PasswordGenerator() {
  const t = useTheme();
  const [length, setLength] = useState("16");
  const [opts, setOpts] = useState<PasswordOptions>({ lower: true, upper: true, digits: true, symbols: true });
  const [res, setRes] = useState(() => makePassword(16, { lower: true, upper: true, digits: true, symbols: true }, Crypto.getRandomBytes));
  const gen = (o = opts, l = length) => setRes(makePassword(Math.min(64, Math.max(6, parseInt(l, 10) || 16)), o, Crypto.getRandomBytes));
  const toggle = (k: keyof PasswordOptions) => { const o = { ...opts, [k]: !opts[k] }; setOpts(o); gen(o); };
  const strength = res.entropyBits >= 100 ? "Very strong" : res.entropyBits >= 70 ? "Strong" : res.entropyBits >= 50 ? "Fair" : "Weak";
  return (
    <Screen>
      <Output value={res.password} />
      <Text style={{ color: t.sub }}>{res.password ? `${strength} · about ${res.entropyBits} bits of entropy` : "Select at least one option"}</Text>
      <Field label="Length (6–64)" value={length} onChangeText={(v) => { setLength(v); gen(opts, v); }} keyboardType="number-pad" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(opts) as (keyof PasswordOptions)[]).map((k) => (
          <Button key={k} variant={opts[k] ? "primary" : "ghost"} title={k[0].toUpperCase() + k.slice(1)} onPress={() => toggle(k)} />
        ))}
      </View>
      <Button title="Regenerate" onPress={() => gen()} />
    </Screen>
  );
}

export function UnitConverter() {
  const t = useTheme();
  const cats = Object.keys(unitTables) as (keyof typeof unitTables)[];
  const [cat, setCat] = useState<string>("Length");
  const names = Object.keys(unitTables[cat]);
  const [from, setFrom] = useState(names[0]);
  const [to, setTo] = useState(names[1]);
  const [value, setValue] = useState("1");
  const change = (c: string) => { const n = Object.keys(unitTables[c]); setCat(c); setFrom(n[0]); setTo(n[1]); };
  const v = parseFloat(value);
  const result = isNaN(v) ? "" : Number(convertUnit(cat, v, from, to).toPrecision(10)).toString();
  return (
    <Screen>
      <Chips options={cats as string[]} value={cat} onChange={change} />
      <Field label="Value" value={value} onChangeText={setValue} keyboardType="numbers-and-punctuation" />
      <Label>From</Label><Chips options={names} value={from} onChange={setFrom} />
      <Label>To</Label><Chips options={names} value={to} onChange={setTo} />
      <Card><Text style={{ color: t.sub, fontSize: 13 }}>Result</Text><Text selectable style={{ color: t.text, fontSize: 30, fontWeight: "800" }}>{result || "—"} <Text style={{ fontSize: 16, color: t.sub }}>{to}</Text></Text></Card>
    </Screen>
  );
}

export function QrGenerator() {
  const t = useTheme();
  const [text, setText] = useState("https://");
  const [err, setErr] = useState("");
  const ref = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);
  const save = () => {
    setErr("");
    ref.current?.toDataURL(async (b64) => {
      try { await shareBase64("qr-code.png", "image/png", b64); } catch (e) { setErr((e as Error).message); }
    });
  };
  return (
    <Screen>
      <Field multiline label="Text or URL" value={text} onChangeText={setText} />
      {text.trim() ? (
        <Card style={{ alignItems: "center", backgroundColor: "#fff" }}>
          <QRCode value={text} size={240} color="#000" backgroundColor="#fff" getRef={(c) => { ref.current = c; }} />
        </Card>
      ) : <Body dim>Enter some text to generate a QR code.</Body>}
      <ErrorText>{err}</ErrorText>
      <Button title="Save / share PNG" disabled={!text.trim()} onPress={save} />
    </Screen>
  );
}
