const esc = (s: string) => s.replace(/([\;,:"])/g, "\\$1");

export type WifiSecurity = "WPA" | "WEP" | "nopass";

/** The text a phone camera reads to join a WiFi network. */
export function wifiString(ssid: string, password: string, security: WifiSecurity, hidden = false): string {
  if (!ssid.trim()) throw new Error("Enter the network name");
  if (security !== "nopass" && !password) throw new Error("Enter the WiFi password");
  return `WIFI:T:${security};S:${esc(ssid)};${security === "nopass" ? "" : `P:${esc(password)};`}${hidden ? "H:true;" : ""};`;
}

const vesc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export interface Contact { first: string; last?: string; org?: string; title?: string; phone?: string; email?: string; url?: string }

/** A contact card (vCard 3.0) that phones offer to save when scanned. */
export function vcardString(c: Contact): string {
  if (!c.first.trim()) throw new Error("Enter a name");
  const full = [c.first, c.last].filter(Boolean).join(" ");
  return ["BEGIN:VCARD", "VERSION:3.0", `N:${vesc(c.last ?? "")};${vesc(c.first)};;;`, `FN:${vesc(full)}`,
    c.org ? `ORG:${vesc(c.org)}` : "", c.title ? `TITLE:${vesc(c.title)}` : "", c.phone ? `TEL;TYPE=CELL:${c.phone.trim()}` : "",
    c.email ? `EMAIL:${c.email.trim()}` : "", c.url ? `URL:${c.url.trim()}` : "", "END:VCARD"].filter(Boolean).join("\n");
}

/** A WhatsApp chat link. A 10-digit number gets the default country code. */
export function waLink(phone: string, message: string, defaultCode = "91"): string {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10) d = defaultCode + d;
  if (d.length < 8 || d.length > 15) throw new Error("Enter a valid phone number with country code");
  return `https://wa.me/${d}${message.trim() ? `?text=${encodeURIComponent(message)}` : ""}`;
}
