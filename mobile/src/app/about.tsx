import { Linking, Text, View } from "react-native";
import { Body, Button, Card, Screen } from "@/components/ui";
import { APP_VERSION, OTAGA_URL, SITE_URL } from "@/config";
import { tools } from "@/data/tools";
import { useTheme } from "@/theme";

export default function About() {
  const t = useTheme();
  const open = (u: string) => Linking.openURL(u).catch(() => {});
  return (
    <Screen>
      <Card>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: "800" }}>ToolBox</Text>
        <Body dim>Version {APP_VERSION} · {tools.length} tools</Body>
        <Body>All your tools in one place. PDFs, images, video, developer and everyday utilities. Free, private and made for your phone.</Body>
        <Body dim>Your files are processed on your device and are not uploaded. A few tools load from our website inside the app and need an internet connection.</Body>
      </Card>
      <View style={{ gap: 10 }}>
        <Button variant="ghost" title="Visit the website" onPress={() => open(SITE_URL)} />
        <Button variant="ghost" title="Privacy Policy" onPress={() => open(`${SITE_URL}/privacy`)} />
        <Button variant="ghost" title="Terms of Use" onPress={() => open(`${SITE_URL}/terms`)} />
        <Button variant="ghost" title="Contact us" onPress={() => open(`${SITE_URL}/contact`)} />
      </View>
      <Body dim style={{ textAlign: "center" }}>An <Text style={{ textDecorationLine: "underline" }} onPress={() => open(OTAGA_URL)}>Otaga</Text> product · Made in India</Body>
    </Screen>
  );
}
