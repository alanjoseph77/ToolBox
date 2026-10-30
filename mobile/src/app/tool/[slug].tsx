import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import WebTool from "@/components/WebTool";
import { getTool } from "@/data/tools";
import { nativeTools } from "@/tools";
import { useTheme } from "@/theme";

export default function ToolScreen() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const tool = getTool(slug);
  const Native = tool ? nativeTools[tool.slug] : undefined;

  if (!tool) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.bg }}><Text style={{ color: t.text }}>Tool not found</Text></View>;
  }
  return (
    <>
      <Stack.Screen options={{ title: tool.name }} />
      {Native ? <Native /> : <WebTool slug={tool.slug} />}
    </>
  );
}
