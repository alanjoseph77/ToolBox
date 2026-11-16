// QR Studio: every QR "type" (website, menu, coupon, event…) is described once here. The form, the server checks and the
// page the customer sees are all driven by these definitions, so a hand-made request cannot slip in unsafe links or oversized data.
import { THEME_IDS, type ThemeId } from "./productThemes";
import { digits, normalizeUrl } from "./product";

export type FieldKind = "text" | "textarea" | "url" | "tel" | "email" | "datetime" | "date" | "select" | "image" | "images" | "list" | "handle";
export interface Field {
  key: string; label: string; kind: FieldKind; required?: boolean; max?: number; placeholder?: string; hint?: string;
  options?: [string, string][];                 // select
  of?: Field[]; maxItems?: number; addLabel?: string;   // list: each row has these fields; addLabel is what the "+ Add …" button says
  kb?: number;                                  // image: target size in KB
  hosts?: string[];                             // url: only these web sites are allowed
}
export interface QrType {
  id: string; name: string; blurb: string; icon: string; fields: Field[]; defaults?: Record<string, unknown>;
  staticText?: (d: Data) => string;             // types that need no page: the QR holds the content itself
  hostedWhen?: (d: Data) => boolean;            // e.g. vCard can be "inside the QR" or a page
}
export type Data = Record<string, unknown> & { theme?: ThemeId };

const f = (key: string, label: string, kind: FieldKind, extra: Partial<Field> = {}): Field => ({ key, label, kind, ...extra });
const CUR: [string, string][] = [["₹", "₹ Rupee"], ["$", "$ Dollar"], ["€", "€ Euro"], ["£", "£ Pound"], ["AED", "AED"], ["SAR", "SAR"], ["Rs", "Rs"]];
const APPLE = ["apps.apple.com", "itunes.apple.com"], GOOGLE = ["play.google.com"];

export const QR_TYPES: QrType[] = [
  { id: "website", name: "Website", blurb: "Open a URL", icon: "Globe", fields: [f("url", "Website address", "url", { required: true, placeholder: "www.myshop.com", hint: "The QR code opens this address directly. No page of ours in between." })], staticText: (d) => String(d.url ?? "") },
  { id: "pdf", name: "PDF", blurb: "Show a PDF", icon: "FileText", fields: [f("title", "Title", "text", { required: true, max: 80, placeholder: "Product catalogue" }), f("description", "Short description", "textarea", { max: 400 }), f("pdfUrl", "Link to your PDF", "url", { required: true, placeholder: "https://drive.google.com/…", hint: "Upload the PDF to Google Drive or Dropbox, share it with “anyone with the link”, and paste the link here." })] },
  { id: "images", name: "Images", blurb: "Show an image gallery", icon: "Images", fields: [f("title", "Title", "text", { required: true, max: 80 }), f("description", "Description", "textarea", { max: 400 }), f("images", "Photos (up to 12)", "images", { maxItems: 12, kb: 100, required: true })] },
  { id: "vcard", name: "vCard Plus", blurb: "Share contact details", icon: "Contact", defaults: { mode: "page" }, fields: [
    f("mode", "How should it work?", "select", { options: [["page", "Contact page (photo, links, Save contact button)"], ["inside", "Details inside the QR (works with no internet)"]] }),
    f("name", "Full name", "text", { required: true, max: 80 }), f("title", "Job title", "text", { max: 80 }), f("company", "Company", "text", { max: 80 }),
    f("phone", "Phone", "tel"), f("email", "Email", "email"), f("website", "Website", "url"), f("address", "Address", "textarea", { max: 200 }),
    f("photo", "Photo (optional)", "image", { kb: 30, hint: "Shown on the contact page only." }), f("instagram", "Instagram", "handle"), f("linkedin", "LinkedIn link", "url"), f("whatsapp", "WhatsApp number", "tel"),
  ], staticText: (d) => vcard(d), hostedWhen: (d) => d.mode !== "inside" },
  { id: "video", name: "Video", blurb: "Show a video", icon: "Video", fields: [f("title", "Title", "text", { required: true, max: 80 }), f("description", "Description", "textarea", { max: 400 }), f("videoUrl", "Video link", "url", { required: true, placeholder: "https://youtu.be/…", hint: "YouTube, Vimeo or a direct .mp4 link." })] },
  { id: "links", name: "List of links", blurb: "Group links", icon: "ListChecks", fields: [f("title", "Page title", "text", { required: true, max: 80, placeholder: "My links" }), f("bio", "Short bio", "textarea", { max: 200 }), f("avatar", "Picture (optional)", "image", { kb: 30 }),
    f("links", "Links", "list", { maxItems: 12, required: true, addLabel: "link", of: [f("label", "Button text", "text", { required: true, max: 40 }), f("url", "Link", "url", { required: true })] })] },
  { id: "social", name: "Social Media", blurb: "Share your social profiles", icon: "ThumbsUp", fields: [f("title", "Name", "text", { required: true, max: 80 }), f("bio", "Short bio", "textarea", { max: 200 }),
    f("instagram", "Instagram", "handle"), f("facebook", "Facebook", "handle"), f("youtube", "YouTube", "handle"), f("twitter", "X (Twitter)", "handle"), f("linkedin", "LinkedIn", "url"), f("telegram", "Telegram", "handle"), f("tiktok", "TikTok", "handle"), f("whatsapp", "WhatsApp number", "tel"), f("website", "Website", "url"), f("email", "Email", "email")] },
  { id: "mp3", name: "MP3", blurb: "Play an audio file", icon: "AudioLines", fields: [f("title", "Title", "text", { required: true, max: 80 }), f("artist", "Artist or speaker", "text", { max: 80 }), f("audioUrl", "Link to the audio file", "url", { required: true, placeholder: "https://…/song.mp3", hint: "A direct link to an .mp3 file." }), f("cover", "Cover picture (optional)", "image", { kb: 40 })] },
  { id: "business", name: "Business", blurb: "Share information about your business", icon: "Store", fields: [f("name", "Business name", "text", { required: true, max: 80 }), f("tagline", "Tagline", "text", { max: 100 }), f("logo", "Logo or photo", "image", { kb: 60 }), f("description", "About", "textarea", { max: 800 }),
    f("services", "Services or products", "list", { maxItems: 8, addLabel: "service", of: [f("name", "Name", "text", { required: true, max: 60 })] }), f("hours", "Opening hours", "textarea", { max: 300, placeholder: "Mon–Sat 9 am – 8 pm\nSun closed" }),
    f("phone", "Phone", "tel"), f("whatsapp", "WhatsApp number", "tel"), f("email", "Email", "email"), f("website", "Website", "url"), f("address", "Address", "textarea", { max: 200 }), f("instagram", "Instagram", "handle"), f("facebook", "Facebook", "handle")] },
  { id: "coupon", name: "Coupon", blurb: "Share a coupon", icon: "Ticket", fields: [f("shop", "Shop name", "text", { max: 70 }), f("title", "Offer", "text", { required: true, max: 90, placeholder: "20% off your first order" }), f("badge", "Big tag", "text", { max: 20, placeholder: "20% OFF" }),
    f("description", "Details", "textarea", { max: 400 }), f("code", "Coupon code", "text", { max: 30, placeholder: "WELCOME20" }), f("validTill", "Valid till", "date"), f("terms", "Terms", "textarea", { max: 400 }),
    f("image", "Picture (optional)", "image", { kb: 80 }), f("website", "Website", "url"), f("whatsapp", "WhatsApp number", "tel", { hint: "Adds a Redeem on WhatsApp button." })] },
  { id: "apps", name: "Apps", blurb: "Redirect to an app store", icon: "Smartphone", fields: [f("name", "App name", "text", { required: true, max: 60 }), f("tagline", "Tagline", "text", { max: 100 }), f("icon", "App icon", "image", { kb: 30 }),
    f("iosUrl", "App Store link (iPhone)", "url", { hosts: APPLE, placeholder: "https://apps.apple.com/…" }), f("androidUrl", "Google Play link (Android)", "url", { hosts: GOOGLE, placeholder: "https://play.google.com/…" }), f("webUrl", "Website (other devices)", "url")] },
  { id: "landing", name: "Landing page", blurb: "Create your own page", icon: "LayoutTemplate", fields: [f("headline", "Headline", "text", { required: true, max: 90 }), f("subheadline", "Sub-heading", "text", { max: 160 }), f("image", "Main picture", "image", { kb: 150 }), f("body", "Text", "textarea", { max: 1500 }),
    f("buttons", "Buttons", "list", { maxItems: 4, addLabel: "button", of: [f("label", "Button text", "text", { required: true, max: 40 }), f("url", "Link", "url", { required: true })] }), f("footer", "Small text at the bottom", "text", { max: 120 })] },
  { id: "event", name: "Event", blurb: "Promote and share an event", icon: "CalendarDays", fields: [f("title", "Event name", "text", { required: true, max: 90 }), f("start", "Starts", "datetime", { required: true }), f("end", "Ends", "datetime"), f("venue", "Venue", "text", { max: 100 }),
    f("address", "Address", "textarea", { max: 200 }), f("description", "About the event", "textarea", { max: 800 }), f("organizer", "Organiser", "text", { max: 80 }), f("link", "Tickets or website", "url"), f("phone", "Phone", "tel"), f("image", "Picture (optional)", "image", { kb: 100 })] },
  { id: "menu", name: "Menu", blurb: "Display the menu of a restaurant or bar", icon: "UtensilsCrossed", defaults: { currency: "₹" }, fields: [f("name", "Restaurant name", "text", { required: true, max: 80 }), f("tagline", "Tagline", "text", { max: 100 }), f("cover", "Cover picture (optional)", "image", { kb: 80 }), f("currency", "Currency", "select", { options: CUR }),
    f("sections", "Menu sections", "list", { maxItems: 8, required: true, addLabel: "section", of: [f("name", "Section name", "text", { required: true, max: 50, placeholder: "Starters" }),
      f("items", "Dishes", "list", { maxItems: 20, addLabel: "dish", of: [f("name", "Dish", "text", { required: true, max: 70 }), f("price", "Price", "text", { max: 20 }), f("desc", "Short description", "text", { max: 140 }), f("veg", "Type", "select", { options: [["", "—"], ["veg", "Veg"], ["nonveg", "Non-veg"]] }), f("photos", "Photos of this dish (up to 3)", "images", { maxItems: 3, kb: 35 })] })] }),
    f("phone", "Phone", "tel"), f("whatsapp", "WhatsApp number", "tel", { hint: "Adds an Order on WhatsApp button." }), f("address", "Address", "textarea", { max: 200 })] },
  { id: "feedback", name: "Feedback", blurb: "Collect feedback and get rated", icon: "MessageSquareHeart", fields: [f("shop", "Shop or business name", "text", { max: 70 }), f("title", "Question", "text", { required: true, max: 90, placeholder: "How was your visit?" }), f("thanks", "Thank-you message", "text", { max: 140, placeholder: "Thank you! Your feedback helps us improve." }),
    f("googleUrl", "Google review link (optional)", "url", { hint: "Customers who give 4 or 5 stars are invited to review you on Google." })] },
];
export const typeOf = (id: string | null | undefined) => QR_TYPES.find((t) => t.id === id);
export const isHosted = (t: QrType, d: Data) => !t.staticText || (t.hostedWhen ? t.hostedWhen(d) : false);

// ---------------------------------------------------------------- checking
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "");
const HANDLE = /^(@?[A-Za-z0-9._-]{1,60}|https?:\/\/\S{3,200})$/;
export const IMG_REF = /^\/api\/qr\/img\?id=([a-hj-km-np-z2-9]{8})&h=([0-9a-f]{12})$/;                 // a picture that is already stored on the server
const DATA_IMG = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
const imgOk = (v: unknown, kb: number) => typeof v === "string" && (IMG_REF.test(v) || (DATA_IMG.test(v) && v.length <= kb * 1400 + 600));
export const MAX_IMAGES = 40;            // pictures per page
export const MAX_TEXT = 150_000;         // characters of text per page (pictures are stored separately)
export const MAX_UPLOAD = 4_000_000;     // characters of new pictures sent in one save

type R<T> = { ok: true; v: T } | { ok: false; error: string };
function cleanField(fd: Field, raw: unknown, depth = 0): R<unknown> {
  const bad = (m: string): R<unknown> => ({ ok: false, error: m }), good = (v: unknown): R<unknown> => ({ ok: true, v });
  const empty = raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && !raw.length);
  const need = () => (fd.required && empty ? bad(`Please fill in “${fd.label}”.`) : null);
  if (fd.kind === "image") { if (empty) return need() ?? good(""); return imgOk(raw, fd.kb ?? 100) ? good(raw) : bad(`The picture for “${fd.label}” is not valid or is too big.`); }
  if (fd.kind === "images") {
    const a = (Array.isArray(raw) ? raw : []).slice(0, fd.maxItems ?? 5); if (!a.length) return need() ?? good([]);
    return a.every((x) => imgOk(x, fd.kb ?? 100)) ? good(a) : bad("One of the pictures is not valid or is too big.");
  }
  if (fd.kind === "list") {
    if (depth > 2) return bad("Too deep.");
    const rows: Record<string, unknown>[] = [];
    for (const r of (Array.isArray(raw) ? raw : []).slice(0, fd.maxItems ?? 10)) {
      const o: Record<string, unknown> = {}; let any = false;
      for (const sf of fd.of ?? []) { const c = cleanField({ ...sf, required: false }, (r as Record<string, unknown>)?.[sf.key], depth + 1); if (!c.ok) return c; o[sf.key] = c.v; if (c.v && !(Array.isArray(c.v) && !c.v.length)) any = true; }
      if (!any) continue;
      for (const sf of fd.of ?? []) if (sf.required && !o[sf.key]) return bad(`Please fill in “${sf.label}” in “${fd.label}”.`);
      rows.push(o);
    }
    return rows.length ? good(rows) : need() ?? good([]);
  }
  if (empty) return need() ?? good("");
  const s = str(raw, fd.max ?? (fd.kind === "textarea" ? 1000 : 300));
  switch (fd.kind) {
    case "url": { const u = normalizeUrl(s); if (!u) return bad(`The address in “${fd.label}” looks wrong. Example: www.myshop.com`); if (fd.hosts && !fd.hosts.includes(new URL(u).hostname.replace(/^www\./, ""))) return bad(`“${fd.label}” must be a link from ${fd.hosts.join(" or ")}.`); return good(u); }
    case "tel": { const d = digits(s); return d ? good(d) : bad(`The phone number in “${fd.label}” looks wrong.`); }
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? good(s) : bad(`The email in “${fd.label}” looks wrong.`);
    case "handle": return HANDLE.test(s) ? good(s.startsWith("http") ? normalizeUrl(s) || "" : s.replace(/^@/, "")) : bad(`“${fd.label}” looks wrong. Use the name (like myshop) or the full link.`);
    case "date": return /^\d{4}-\d{2}-\d{2}$/.test(s) ? good(s) : bad(`The date in “${fd.label}” looks wrong.`);
    case "datetime": return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? good(s) : bad(`The date and time in “${fd.label}” look wrong.`);
    case "select": return (fd.options ?? []).some(([v]) => v === s) ? good(s) : good(fd.options?.[0]?.[0] ?? "");
    default: return good(s);
  }
}
export function cleanData(type: QrType, raw: unknown): { ok: true; d: Data } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>, d: Data = {};
  for (const fd of type.fields) {
    const need = fd.key === "name" || fd.key === "title" || fd.required;
    const c = cleanField(fd, r[fd.key] ?? type.defaults?.[fd.key]); if (!c.ok) return c; void need; d[fd.key] = c.v;
  }
  d.theme = (THEME_IDS.includes(str(r.theme, 12)) ? str(r.theme, 12) : "clean") as ThemeId;
  const imgs = listImages(type, d), upload = imgs.filter((x) => !IMG_REF.test(x)).reduce((n, x) => n + x.length, 0);
  if (imgs.length > MAX_IMAGES) return { ok: false, error: `There are ${imgs.length} pictures. The limit is ${MAX_IMAGES} per page. Remove some.` };
  if (upload > MAX_UPLOAD) return { ok: false, error: "The new pictures are too big to save in one go. Save fewer at a time." };
  if (JSON.stringify(d).length - imgs.reduce((n, x) => n + (IMG_REF.test(x) ? 0 : x.length), 0) > MAX_TEXT) return { ok: false, error: "That is too much text. Shorten it a little." };
  return { ok: true, d };
}

// ---------------------------------------------------------------- pictures inside a page
type Obj = Record<string, unknown>;
/** Runs `fn` on every picture in a page (single pictures, galleries and pictures inside lists such as menu dishes). */
export function mapImages(fields: Field[], v: Obj, fn: (src: string) => string): Obj {
  const out: Obj = { ...v };
  for (const f of fields) {
    const x = out[f.key];
    if (f.kind === "image" && typeof x === "string" && x) out[f.key] = fn(x);
    else if (f.kind === "images" && Array.isArray(x)) out[f.key] = x.map((a) => (typeof a === "string" ? fn(a) : "")).filter(Boolean);
    else if (f.kind === "list" && Array.isArray(x) && f.of) out[f.key] = x.map((r) => mapImages(f.of!, (r ?? {}) as Obj, fn));
  }
  return out;
}
export function listImages(type: QrType, d: Obj): string[] { const all: string[] = []; mapImages(type.fields, d, (s) => { all.push(s); return s; }); return all; }

// ---------------------------------------------------------------- builders used by the pages
const ve = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
export function vcard(d: Data): string {
  const n = String(d.name ?? ""), parts = n.split(/\s+/), last = parts.length > 1 ? parts.pop()! : "", first = parts.join(" ");
  const L = ["BEGIN:VCARD", "VERSION:3.0", `N:${ve(last)};${ve(first)};;;`, `FN:${ve(n)}`];
  if (d.company) L.push(`ORG:${ve(d.company)}`); if (d.title) L.push(`TITLE:${ve(d.title)}`);
  if (d.phone) L.push(`TEL;TYPE=CELL:${d.phone}`); if (d.email) L.push(`EMAIL:${ve(d.email)}`); if (d.website) L.push(`URL:${d.website}`);
  if (d.address) L.push(`ADR;TYPE=WORK:;;${ve(d.address)};;;;`); if (d.linkedin) L.push(`URL:${d.linkedin}`);
  L.push("END:VCARD"); return L.join("\r\n");
}
export function ics(d: Data, url = ""): string {
  const t = (s: unknown) => String(s ?? "").replace(/[-:]/g, "") + "00", stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ToolBox//QR Studio//EN", "BEGIN:VEVENT", `UID:${Date.now()}@toolbox.otaga.in`, `DTSTAMP:${stamp}`, `DTSTART:${t(d.start)}`];
  if (d.end) L.push(`DTEND:${t(d.end)}`); L.push(`SUMMARY:${ve(d.title)}`);
  const loc = [d.venue, d.address].filter(Boolean).join(", "); if (loc) L.push(`LOCATION:${ve(loc)}`);
  const desc = [d.description, url].filter(Boolean).join("\n\n"); if (desc) L.push(`DESCRIPTION:${ve(desc)}`);
  L.push("END:VEVENT", "END:VCALENDAR"); return L.join("\r\n");
}
/** YouTube or Vimeo address → a safe embed address; anything else is not embedded. */
export function embedUrl(u: string): string {
  try {
    const x = new URL(u), h = x.hostname.replace(/^www\./, "");
    if (h === "youtu.be") return /^[\w-]{6,15}$/.test(x.pathname.slice(1)) ? `https://www.youtube-nocookie.com/embed/${x.pathname.slice(1)}` : "";
    if (h === "youtube.com" || h === "m.youtube.com") { const v = x.searchParams.get("v") ?? (x.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,15})/)?.[1] ?? ""); return /^[\w-]{6,15}$/.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : ""; }
    if (h === "vimeo.com") { const v = x.pathname.match(/^\/(\d{5,12})/)?.[1]; return v ? `https://player.vimeo.com/video/${v}` : ""; }
  } catch { /* not a link */ }
  return "";
}
const SOCIAL: Record<string, [string, (h: string) => string]> = {
  instagram: ["Instagram", (h) => `https://instagram.com/${h}`], facebook: ["Facebook", (h) => `https://facebook.com/${h}`], youtube: ["YouTube", (h) => `https://youtube.com/@${h}`],
  twitter: ["X (Twitter)", (h) => `https://x.com/${h}`], telegram: ["Telegram", (h) => `https://t.me/${h}`], tiktok: ["TikTok", (h) => `https://tiktok.com/@${h}`],
};
export function socialLink(key: string, v: unknown): { label: string; href: string } | null {
  const s = String(v ?? ""); if (!s) return null; const [label, mk] = SOCIAL[key] ?? [key, (h: string) => h];
  return { label, href: s.startsWith("http") ? s : mk(s) };
}
export const SOCIAL_KEYS = Object.keys(SOCIAL);
