// Ready-made starting points for shop owners: a look (theme, poster layout, QR style) plus sample content to replace.
import type { Product } from "./product";
import type { QrStyle } from "./qrStyle";
import type { ThemeId } from "./productThemes";

export type PosterLayout = "classic" | "bold" | "minimal";
export const LAYOUTS: { id: PosterLayout; name: string; hint: string }[] = [
  { id: "classic", name: "Classic", hint: "Photo on top, QR at the bottom" },
  { id: "bold", name: "Bold", hint: "Full colour with a round photo" },
  { id: "minimal", name: "QR first", hint: "Big QR code, small photo (good for tables and counters)" },
];

export interface Template {
  id: string; name: string; tagline: string; emoji: string; photo: [string, string];       // photo: gradient behind the sample picture
  theme: ThemeId; layout: PosterLayout; style: Partial<QrStyle>; product: Partial<Product>;
}

export const TEMPLATES: Template[] = [
  { id: "boutique", name: "Boutique & fashion", tagline: "Clothes, sarees, bags, shoes", emoji: "👗", photo: ["#f472b6", "#be185d"], theme: "rose", layout: "classic",
    style: { body: "rounded", eyeOuter: "rounded", eyeInner: "rounded", color: "#9f1239", gradient: "none", eyeColor: "#4c0519", bg: "#ffffff", frame: "label", label: "Scan to order" },
    product: { name: "Handloom cotton saree", price: "1499", mrp: "2199", desc: "Soft handloom cotton with a woven border. Comes with a matching blouse piece. Easy to wash and wear.", offer: "Festival sale", stock: "limited", extra: [{ k: "Fabric", v: "Cotton" }, { k: "Length", v: "5.5 m + blouse" }], shop: "Your Boutique" } },
  { id: "jewellery", name: "Jewellery", tagline: "Gold, silver, imitation, gifts", emoji: "💍", photo: ["#fbbf24", "#92400e"], theme: "royal", layout: "bold",
    style: { body: "diamond", eyeOuter: "square", eyeInner: "diamond", color: "#92400e", color2: "#b45309", gradient: "linear", eyeColor: "#451a03", bg: "#ffffff", frame: "box", label: "Scan to view" },
    product: { name: "Temple design necklace set", price: "2999", mrp: "3999", desc: "Antique gold finish necklace with matching earrings. Light weight and skin friendly. Gift box included.", offer: "Free gift box", stock: "in", extra: [{ k: "Finish", v: "Antique gold" }, { k: "Includes", v: "Necklace + earrings" }], shop: "Your Jewellers" } },
  { id: "bakery", name: "Bakery & cafe", tagline: "Cakes, snacks, sweets, coffee", emoji: "🎂", photo: ["#fdba74", "#c2410c"], theme: "warm", layout: "classic",
    style: { body: "dots", eyeOuter: "circle", eyeInner: "circle", color: "#9a3412", color2: "#ea580c", gradient: "diagonal", eyeColor: "#431407", bg: "#ffffff", frame: "label", label: "Scan to order" },
    product: { name: "Chocolate truffle cake", price: "899", mrp: "", desc: "Rich chocolate sponge with silky ganache. Baked fresh on the day. Order 6 hours before pickup or delivery.", offer: "Fresh today", stock: "in", extra: [{ k: "Weight", v: "500 g / 1 kg" }, { k: "Eggless", v: "Available" }], shop: "Your Bakery" } },
  { id: "kirana", name: "Grocery & kirana", tagline: "Daily needs, home delivery", emoji: "🛒", photo: ["#86efac", "#15803d"], theme: "fresh", layout: "classic",
    style: { body: "leaf", eyeOuter: "leaf", eyeInner: "leaf", color: "#15803d", gradient: "none", eyeColor: "#14532d", bg: "#f0fdf4", frame: "label", label: "Scan to order" },
    product: { name: "Fresh vegetable box", price: "349", mrp: "420", desc: "Seasonal vegetables picked this morning: tomato, onion, potato, greens and more. Free home delivery within 3 km.", offer: "Free delivery", stock: "in", extra: [{ k: "Weight", v: "5 kg" }, { k: "Delivery", v: "Same day" }], shop: "Your Kirana Store" } },
  { id: "mobile", name: "Mobile & electronics", tagline: "Phones, gadgets, accessories", emoji: "📱", photo: ["#60a5fa", "#1e3a8a"], theme: "ocean", layout: "bold",
    style: { body: "square", eyeOuter: "rounded", eyeInner: "square", color: "#0c4a6e", color2: "#0369a1", gradient: "linear", eyeColor: "#082f49", bg: "#ffffff", frame: "box", label: "Scan for price" },
    product: { name: "Fast charger 33W with cable", price: "799", mrp: "1299", desc: "33W fast charger with 1 m Type-C cable. Overheat and short circuit protection. 6 months warranty.", offer: "6 months warranty", stock: "in", extra: [{ k: "Power", v: "33W" }, { k: "Port", v: "Type-C" }], shop: "Your Mobile Shop" } },
  { id: "salon", name: "Salon & services", tagline: "Haircut, spa, repairs, classes", emoji: "✂️", photo: ["#c4b5fd", "#6d28d9"], theme: "rose", layout: "minimal",
    style: { body: "dots", eyeOuter: "rounded", eyeInner: "circle", color: "#9f1239", color2: "#7c3aed", gradient: "diagonal", eyeColor: "#4c0519", bg: "#ffffff", frame: "label", label: "Scan to book" },
    product: { name: "Hair spa and styling", price: "999", mrp: "1499", desc: "Deep conditioning hair spa with head massage and styling. About 60 minutes. Book a slot on WhatsApp.", offer: "Book today", stock: "", extra: [{ k: "Time", v: "60 minutes" }, { k: "Open", v: "10 am to 8 pm" }], shop: "Your Salon" } },
  { id: "craft", name: "Handmade & crafts", tagline: "Art, candles, decor, gifts", emoji: "🕯️", photo: ["#fcd34d", "#a16207"], theme: "warm", layout: "bold",
    style: { body: "vbars", eyeOuter: "rounded", eyeInner: "rounded", color: "#b45309", gradient: "none", eyeColor: "#7c2d12", bg: "#fffbeb", frame: "label", label: "Scan to order" },
    product: { name: "Scented soy candle", price: "349", mrp: "", desc: "Hand poured soy wax candle with a cotton wick. Burns for 25 hours. Lavender, vanilla and sandalwood.", offer: "Made to order", stock: "in", extra: [{ k: "Burn time", v: "25 hours" }, { k: "Scents", v: "Lavender, vanilla, sandalwood" }], shop: "Your Craft Studio" } },
  { id: "plants", name: "Plants & nursery", tagline: "Indoor plants, pots, seeds", emoji: "🪴", photo: ["#6ee7b7", "#047857"], theme: "fresh", layout: "minimal",
    style: { body: "rounded", eyeOuter: "circle", eyeInner: "circle", color: "#047857", color2: "#15803d", gradient: "linear", eyeColor: "#064e3b", bg: "#ffffff", frame: "label", label: "Scan to buy" },
    product: { name: "Money plant in ceramic pot", price: "299", mrp: "399", desc: "Easy care indoor plant in a white ceramic pot. Grows in low light. Care card included.", offer: "Free care card", stock: "in", extra: [{ k: "Height", v: "30 cm" }, { k: "Light", v: "Low to medium" }], shop: "Your Nursery" } },
  { id: "restaurant", name: "Restaurant & food", tagline: "Dishes, combos, table menu", emoji: "🍛", photo: ["#fb923c", "#9a3412"], theme: "warm", layout: "minimal",
    style: { body: "dots", eyeOuter: "rounded", eyeInner: "circle", color: "#7c2d12", gradient: "none", eyeColor: "#431407", bg: "#ffffff", frame: "box", label: "Scan to order" },
    product: { name: "Chicken biryani combo", price: "249", mrp: "299", desc: "Aromatic basmati biryani with raita and salad. Freshly cooked, served hot. Order for dine in, pickup or delivery.", offer: "Lunch special", stock: "in", extra: [{ k: "Serves", v: "1 person" }, { k: "Time", v: "20 minutes" }], shop: "Your Restaurant" } },
];
export const templateOf = (id: string | null | undefined) => TEMPLATES.find((t) => t.id === id);

/** A simple picture for a sample product: a colour gradient with a big emoji (browser only). */
export function samplePhoto(t: Template, px = 700): string {
  const c = document.createElement("canvas"); c.width = c.height = px; const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, px, px); gr.addColorStop(0, t.photo[0]); gr.addColorStop(1, t.photo[1]); g.fillStyle = gr; g.fillRect(0, 0, px, px);
  g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.arc(px * 0.85, px * 0.15, px * 0.32, 0, 7); g.fill(); g.beginPath(); g.arc(px * 0.1, px * 0.95, px * 0.28, 0, 7); g.fill();
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = `${Math.round(px * 0.5)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.fillText(t.emoji, px / 2, px * 0.54);
  return c.toDataURL("image/jpeg", 0.85);
}
