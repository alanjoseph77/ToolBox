import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Info, Search } from "lucide-react-native";
import ToolRow from "@/components/ToolRow";
import { Chips } from "@/components/ui";
import { categories, tools, type Category } from "@/data/tools";
import { useTheme } from "@/theme";

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tools.filter((x) => (cat === "All" || x.category === cat) && (!s || `${x.name} ${x.description} ${x.category}`.toLowerCase().includes(s)));
  }, [q, cat]);

  return (
    <>
      <Stack.Screen options={{ headerRight: () => (
        <Pressable onPress={() => router.push("/about")} accessibilityLabel="About" hitSlop={12}><Info size={22} color={t.text} /></Pressable>
      ) }} />
      <FlatList
        data={list}
        keyExtractor={(x) => x.slug}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>All your tools in one place</Text>
            <Text style={{ color: t.sub, fontSize: 15 }}>Free, private and fast. Your files stay on your device.</Text>
            <View style={[s.search, { borderColor: t.border, backgroundColor: t.card }]}>
              <Search size={18} color={t.sub} />
              <TextInput value={q} onChangeText={setQ} placeholder="What do you want to do today?" placeholderTextColor={t.sub}
                style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: 12 }} autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" />
            </View>
            <Chips options={["All", ...categories] as readonly (Category | "All")[]} value={cat} onChange={setCat} />
          </View>
        }
        ListEmptyComponent={<Text style={{ color: t.sub, textAlign: "center", marginTop: 32 }}>No tool found for “{q}”.</Text>}
        renderItem={({ item }) => <ToolRow tool={item} />}
      />
    </>
  );
}

const s = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
});
