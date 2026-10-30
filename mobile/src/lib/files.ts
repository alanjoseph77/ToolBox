import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const UTI: Record<string, string> = {
  "application/pdf": "com.adobe.pdf", "image/jpeg": "public.jpeg", "image/png": "public.png",
  "image/webp": "org.webmproject.webp", "text/plain": "public.plain-text",
};

export const safeName = (n: string) => n.replace(/[^\w.\-]+/g, "_") || "file";

export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

export const readBase64 = (uri: string) => FileSystem.readAsStringAsync(uri, { encoding: "base64" });

export async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? info.size ?? 0 : 0;
}

/** Opens the system share sheet for a file (where users choose "Save to Files", Drive, WhatsApp, ...). */
export async function shareUri(uri: string, mime: string, title?: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(uri, { mimeType: mime, UTI: UTI[mime], dialogTitle: title });
}

export async function shareBase64(name: string, mime: string, base64: string) {
  const uri = `${FileSystem.cacheDirectory}${safeName(name)}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" });
  await shareUri(uri, mime, name);
  return uri;
}

export async function shareText(name: string, text: string) {
  const uri = `${FileSystem.cacheDirectory}${safeName(name)}`;
  await FileSystem.writeAsStringAsync(uri, text, { encoding: "utf8" });
  await shareUri(uri, "text/plain", name);
}

export async function pickPdfs(multiple = true) {
  const r = await DocumentPicker.getDocumentAsync({ type: "application/pdf", multiple, copyToCacheDirectory: true });
  return r.canceled ? [] : r.assets;
}

export async function pickImages(multiple = true) {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: multiple, quality: 1 });
  return r.canceled ? [] : r.assets;
}
