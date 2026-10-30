import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useScheme, useTheme } from "@/theme";

export default function RootLayout() {
  const t = useTheme();
  const scheme = useScheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTitleStyle: { color: t.text, fontWeight: "700" },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "ToolBox" }} />
        <Stack.Screen name="tool/[slug]" options={{ title: "" }} />
        <Stack.Screen name="about" options={{ title: "About" }} />
      </Stack>
    </>
  );
}
