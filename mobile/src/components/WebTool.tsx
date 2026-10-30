import { useCallback, useRef, useState, type ComponentType, type Ref } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";

// The package types omit `ref`, which the native components do accept.
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<{ reload: () => void }> }>;
import { SITE_URL } from "@/config";
import { shareBase64 } from "@/lib/files";
import { useScheme, useTheme } from "@/theme";

/**
 * Page script (runs before the site loads):
 *  - turns website "download" links into messages, because a WebView cannot save blob: files by itself;
 *  - applies the phone's light/dark setting to the site.
 */
const bridge = (scheme: string) => `
(function(){
  try { localStorage.setItem('theme', '${scheme}'); } catch(e) {}
  var post = function(o){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  var send = function(a){
    fetch(a.href).then(function(r){ return r.blob(); }).then(function(b){
      var fr = new FileReader();
      fr.onloadend = function(){ var s = String(fr.result); post({ type:'file', name: a.getAttribute('download') || 'file', mime: b.type || 'application/octet-stream', data: s.slice(s.indexOf(',')+1) }); };
      fr.readAsDataURL(b);
    }).catch(function(e){ post({ type:'error', message: String(e) }); });
  };
  var orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    if (this.hasAttribute('download') && this.href) { send(this); return; }
    return orig.apply(this, arguments);
  };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[download]');
    if (!a) return; e.preventDefault(); e.stopPropagation(); send(a);
  }, true);
})(); true;`;

export default function WebTool({ slug }: { slug: string }) {
  const t = useTheme();
  const scheme = useScheme();
  const ref = useRef<{ reload: () => void }>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const origin = new URL(SITE_URL).origin;

  const onMessage = useCallback(async (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === "file") await shareBase64(m.name, m.mime, m.data);
      else if (m.type === "error") Alert.alert("Download failed", m.message);
    } catch (err) { Alert.alert("Could not save the file", (err as Error).message); }
  }, []);

  if (failed) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>You are offline</Text>
        <Text style={{ color: t.sub, textAlign: "center", marginTop: 6 }}>This tool needs an internet connection to load. Your files still never leave your device.</Text>
        <Pressable onPress={() => { setFailed(false); setLoading(true); ref.current?.reload(); }} style={[s.retry, { backgroundColor: t.primary }]}>
          <Text style={{ color: t.onPrimary, fontWeight: "700" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <WebView
        ref={ref}
        source={{ uri: `${SITE_URL}/${slug}` }}
        applicationNameForUserAgent="ToolBoxApp/1.0"
        injectedJavaScriptBeforeContentLoaded={bridge(scheme)}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) setFailed(true); }}
        originWhitelist={["https://*"]}
        // Links that leave the site open in the normal browser.
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith(origin) || req.url.startsWith("about:") || req.url.startsWith("blob:") || req.url.startsWith("data:")) return true;
          Linking.openURL(req.url).catch(() => {});
          return false;
        }}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures
        style={{ backgroundColor: t.bg }}
      />
      {loading && <View style={[StyleSheet.absoluteFill, s.center, { backgroundColor: t.bg }]}><ActivityIndicator color={t.text} /></View>}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  retry: { marginTop: 16, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
});
