import { ReactNode, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme";

export const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[s.label, { color: t.sub }]}>{children}</Text>;
}

export function Body({ children, dim, style }: { children: ReactNode; dim?: boolean; style?: object }) {
  const t = useTheme();
  return <Text style={[{ color: dim ? t.sub : t.text, fontSize: 15, lineHeight: 21 }, style]}>{children}</Text>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  const t = useTheme();
  return children ? <Text style={{ color: t.danger, fontSize: 14 }}>{children}</Text> : null;
}

export function Button({ title, onPress, variant = "primary", disabled, loading, testID }: {
  title: string; onPress: () => void; variant?: "primary" | "ghost"; disabled?: boolean; loading?: boolean; testID?: string;
}) {
  const t = useTheme();
  const primary = variant === "primary";
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID} accessibilityRole="button" disabled={off}
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }}
      style={({ pressed }) => [s.btn, { backgroundColor: primary ? t.primary : "transparent", borderColor: primary ? t.primary : t.border, opacity: off ? 0.4 : pressed ? 0.8 : 1 }]}
    >
      {loading ? <ActivityIndicator color={primary ? t.onPrimary : t.text} /> : <Text style={[s.btnText, { color: primary ? t.onPrimary : t.text }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, mono, ...props }: TextInputProps & { label?: string; mono?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={t.sub} autoCapitalize="none" autoCorrect={false} spellCheck={false}
        {...props}
        style={[s.input, { color: t.text, borderColor: t.border, backgroundColor: t.card, fontFamily: mono ? MONO : undefined }, props.multiline && { minHeight: 140, textAlignVertical: "top" }, props.style]}
      />
    </View>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={[s.chip, { backgroundColor: on ? t.primary : "transparent", borderColor: on ? t.primary : t.border }]}>
            <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: "600", fontSize: 14 }}>{o}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>;
}

/** Selectable output text with a copy button. */
export function Output({ value, mono = true }: { value: string; mono?: boolean }) {
  const t = useTheme();
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <Card>
      <Text selectable style={{ color: t.text, fontSize: 14, lineHeight: 20, fontFamily: mono ? MONO : undefined }}>{value}</Text>
      <Button variant="ghost" title={copied ? "Copied ✓" : "Copy"} onPress={async () => { await Clipboard.setStringAsync(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }} />
    </Card>
  );
}

const s = StyleSheet.create({
  screen: { padding: 16, gap: 14, paddingBottom: 48 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  btn: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
});
