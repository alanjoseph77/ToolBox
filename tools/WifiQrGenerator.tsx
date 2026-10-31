"use client";
import { useMemo, useState } from "react";
import QrBox from "@/components/QrBox";
import { wifiString, type WifiSecurity } from "@/lib/qrText";

export default function WifiQrGenerator() {
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");
  const [sec, setSec] = useState<WifiSecurity>("WPA");
  const [hidden, setHidden] = useState(false);
  const res = useMemo(() => { if (!ssid.trim()) return { text: "", error: "" }; try { return { text: wifiString(ssid, pass, sec, hidden), error: "" }; } catch (e) { return { text: "", error: pass || sec === "nopass" ? (e as Error).message : "" }; } }, [ssid, pass, sec, hidden]);
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div><label className="label" htmlFor="ssid">Network name (SSID)</label><input id="ssid" className="input" value={ssid} onChange={(e) => setSsid(e.target.value)} /></div>
        <div><label className="label" htmlFor="sec">Security</label>
          <select id="sec" className="input" value={sec} onChange={(e) => setSec(e.target.value as WifiSecurity)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></div>
        {sec !== "nopass" && <div><label className="label" htmlFor="wp">Password</label><input id="wp" className="input" value={pass} onChange={(e) => setPass(e.target.value)} /></div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hidden network</label>
        {res.error && <p className="text-sm text-red-600">{res.error}</p>}
      </div>
      <QrBox text={res.text} filename="wifi-qr.png" />
      {res.text && <p className="text-xs text-neutral-500">Guests scan this with their phone camera to join. The password is inside the QR code, so share it only with people you trust.</p>}
    </div>
  );
}
