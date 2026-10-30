import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { iconFor } from "@/data/icons";
import type { ToolDef } from "@/data/tools";
import { useScheme, useTheme } from "@/theme";

export default function ToolRow({ tool }: { tool: ToolDef }) {
  const t = useTheme();
  const dark = useScheme() === "dark";
  const router = useRouter();
  const Icon = iconFor(tool.slug);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/tool/[slug]", params: { slug: tool.slug } })}
      accessibilityRole="button" accessibilityLabel={tool.name}
      style={({ pressed }) => [s.row, { backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[s.icon, { backgroundColor: dark ? "#171717" : "#f5f5f5", borderColor: t.border }]}><Icon size={22} color={t.text} strokeWidth={2} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: "700" }}>{tool.name}</Text>
        <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{tool.description}</Text>
      </View>
      {!tool.native && <Text style={[s.tag, { color: t.sub, borderColor: t.border }]}>Online</Text>}
      <ChevronRight size={18} color={t.sub} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderRadius: 16 },
  icon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tag: { fontSize: 11, fontWeight: "700", borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
