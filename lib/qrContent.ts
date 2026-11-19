// What a plain QR code holds: the text a phone reads when it scans it. Pure functions, tested on their own.
import { waDigits } from "./product";

export type Kind = "link" | "text" | "wifi" | "phone" | "sms" | "email" | "whatsapp" | "location";
export type Fields = Record<string, string>;

export const KINDS: { id: Kind; label: string; hint: string }[] = [
  { id: "link", label: "Link", hint: "Opens a website" },
  { id: "text", label: "Text", hint: "Shows a message" },
  { id: "wifi", label: "Wi-Fi", hint: "Joins your Wi-Fi" },
  { id: "whatsapp", label: "WhatsApp", hint: "Opens a chat" },
  { id: "phone", label: "Call", hint: "Dials a number" },
  { id: "sms", label: "SMS", hint: "Writes a text message" },
  { id: "email", label: "Email", hint: "Writes an email" },
  { id: "location", label: "Location", hint: "Opens a map" },
];

const wifiEsc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const enc = encodeURIComponent;

/** The text inside the QR code, or "" when something required is missing. */
export function qrText(kind: Kind, v: Fields): string {
  const t = (k: string) => (v[k] ?? "").trim();
  switch (kind) {
    case "link": { const u = t("url"); if (!u || u === "https://") return ""; return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`; }
    case "text": return t("text");
    case "wifi": { if (!t("ssid")) return ""; const sec = v.security || "WPA"; return `WIFI:T:${sec === "nopass" ? "nopass" : sec};S:${wifiEsc(t("ssid"))};${sec === "nopass" ? "" : `P:${wifiEsc(v.password ?? "")};`}${v.hidden === "1" ? "H:true;" : ""};`; }
    case "phone": { const n = t("phone").replace(/[^\d+]/g, ""); return n ? `tel:${n}` : ""; }
    case "sms": { const n = t("phone").replace(/[^\d+]/g, ""); return n ? `SMSTO:${n}:${t("message")}` : ""; }
    case "email": { const a = t("to"); if (!a) return ""; const q = [t("subject") && `subject=${enc(t("subject"))}`, t("body") && `body=${enc(t("body"))}`].filter(Boolean).join("&"); return `mailto:${a}${q ? `?${q}` : ""}`; }
    case "whatsapp": { const d = waDigits(t("phone")); if (d.length < 8) return ""; return `https://wa.me/${d}${t("message") ? `?text=${enc(t("message"))}` : ""}`; }
    case "location": {
      const lat = parseFloat(t("lat")), lng = parseFloat(t("lng"));
      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      return t("place") ? `https://www.google.com/maps/search/?api=1&query=${enc(t("place"))}` : "";
    }
  }
}

/** Plain-language hint about what is missing, for the empty state. */
export const needs: Record<Kind, string> = {
  link: "Type a website address.", text: "Type your message.", wifi: "Type the Wi-Fi name.", phone: "Type a phone number.", sms: "Type a phone number.",
  email: "Type an email address.", whatsapp: "Type a WhatsApp number with country code, or a 10-digit Indian number.", location: "Type a place or address, or latitude and longitude.",
};
