import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import { Body, Button, Card, Chips, ErrorText, Field, Label, Output, Row, Screen } from "@/components/ui";
import { b64DecodeUtf8, b64EncodeUtf8, decodeJwt, findMatches } from "@/lib/text";
import { useTheme } from "@/theme";

export function JsonFormatter() {
  const [input, setInput] = useState('{"name":"ToolBox","tools":[1,2,3]}');
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const run = (indent?: number) => {
    try { setOut(JSON.stringify(JSON.parse(input), null, indent)); setErr(""); }
    catch (e) { setOut(""); setErr((e as Error).message); }
  };
  return (
    <Screen>
      <Field mono multiline value={input} onChangeText={setInput} placeholder="Paste JSON" />
      <Row>
        <View style={{ flex: 1 }}><Button title="Format" onPress={() => run(2)} /></View>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Minify" onPress={() => run()} /></View>
      </Row>
      {err ? <ErrorText>Invalid JSON: {err}</ErrorText> : out ? <Body>✓ Valid JSON</Body> : null}
      <Output value={out} />
    </Screen>
  );
}

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState<"Standard" | "URL-safe">("Standard");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const run = (enc: boolean) => {
    try { setOut(enc ? b64EncodeUtf8(input, urlSafe === "URL-safe") : b64DecodeUtf8(input)); setErr(""); }
    catch { setOut(""); setErr(enc ? "Could not encode this text." : "That is not valid Base64 text."); }
  };
  return (
    <Screen>
      <Field mono multiline value={input} onChangeText={setInput} placeholder="Enter text or Base64" />
      <Chips options={["Standard", "URL-safe"] as const} value={urlSafe} onChange={setUrlSafe} />
      <Row>
        <View style={{ flex: 1 }}><Button title="Encode" onPress={() => run(true)} /></View>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Decode" onPress={() => run(false)} /></View>
      </Row>
      <ErrorText>{err}</ErrorText>
      <Output value={out} />
    </Screen>
  );
}

export function UrlCodec() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"Component" | "Full URL">("Component");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const run = (enc: boolean) => {
    try {
      const full = mode === "Full URL";
      setOut(enc ? (full ? encodeURI(input) : encodeURIComponent(input)) : (full ? decodeURI(input) : decodeURIComponent(input)));
      setErr("");
    } catch { setOut(""); setErr("Malformed input: could not decode."); }
  };
  return (
    <Screen>
      <Field mono multiline value={input} onChangeText={setInput} placeholder="Paste text or a URL" />
      <Chips options={["Component", "Full URL"] as const} value={mode} onChange={setMode} />
      <Row>
        <View style={{ flex: 1 }}><Button title="Encode" onPress={() => run(true)} /></View>
        <View style={{ flex: 1 }}><Button variant="ghost" title="Decode" onPress={() => run(false)} /></View>
      </Row>
      <ErrorText>{err}</ErrorText>
      <Output value={out} />
    </Screen>
  );
}

export function UuidGenerator() {
  const [count, setCount] = useState("5");
  const [ids, setIds] = useState<string[]>([]);
  const gen = () => {
    const n = Math.min(100, Math.max(1, parseInt(count, 10) || 1));
    setIds(Array.from({ length: n }, () => Crypto.randomUUID()));
  };
  return (
    <Screen>
      <Field label="How many (1–100)" value={count} onChangeText={setCount} keyboardType="number-pad" />
      <Button title="Generate" onPress={gen} />
      <Output value={ids.join("\n")} />
    </Screen>
  );
}

export function JwtDecoder() {
  const t = useTheme();
  const [token, setToken] = useState("");
  const result = useMemo(() => {
    if (!token.trim()) return null;
    try { return decodeJwt(token); } catch { return "error" as const; }
  }, [token]);
  const exp = result && result !== "error" && typeof result.payload.exp === "number" ? new Date(result.payload.exp * 1000) : null;
  return (
    <Screen>
      <Field mono multiline value={token} onChangeText={setToken} placeholder="Paste a JWT (eyJ…)" />
      {result === "error" && <ErrorText>This does not look like a valid JWT.</ErrorText>}
      {result && result !== "error" && (
        <>
          <Label>Header</Label><Output value={JSON.stringify(result.header, null, 2)} />
          <Label>Payload</Label><Output value={JSON.stringify(result.payload, null, 2)} />
          {exp && <Text style={{ color: t.text, fontWeight: "700" }}>{exp < new Date() ? "Expired" : "Valid until"} {exp.toLocaleString()}</Text>}
          <Body dim>The signature is not verified. Decoding happens only on your device.</Body>
        </>
      )}
    </Screen>
  );
}

export function RegexTester() {
  const t = useTheme();
  const [pattern, setPattern] = useState("(\\w+)@(\\w+)\\.com");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Contact: alice@example.com, bob@toolbox.com");
  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [], error: "" };
    try { return { matches: findMatches(pattern, flags, text), error: "" }; }
    catch (e) { return { matches: [], error: (e as Error).message }; }
  }, [pattern, flags, text]);
  return (
    <Screen>
      <Field mono label="Pattern" value={pattern} onChangeText={setPattern} />
      <Field mono label="Flags" value={flags} onChangeText={(v) => setFlags(v.replace(/[^gimsuy]/g, ""))} />
      <Field mono multiline label="Test text" value={text} onChangeText={setText} />
      <ErrorText>{error}</ErrorText>
      <Text style={{ color: t.text, fontWeight: "700" }}>{matches.length} match{matches.length === 1 ? "" : "es"}</Text>
      {matches.map((m, i) => (
        <Card key={i}>
          <Text style={{ color: t.text, fontSize: 14 }}>#{i + 1} “{m.text}” at {m.index}</Text>
          {m.groups.length > 0 && <Text style={{ color: t.sub, fontSize: 13 }}>{m.groups.map((g, k) => `$${k + 1}=${g ?? "∅"}`).join(", ")}</Text>}
        </Card>
      ))}
    </Screen>
  );
}
