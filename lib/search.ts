// Smart tool search: understands everyday words ("bg", "photo", "song"), typos ("compres"), any word order
// and sizes like "50kb". Pure functions, no network, fast enough to run on every key press.
import { tools, type ToolMeta as Tool } from "./tools";

const STOP = new Set(["a", "an", "the", "to", "into", "in", "on", "of", "for", "from", "and", "or", "my", "me", "i", "want", "need", "how", "do", "can", "with", "make", "online", "free", "tool", "tools", "please", "file", "files", "it", "this", "is", "app", "converter", "maker", "creator", "builder"]);

// Everyday word -> words the tools use. Kept small and obvious.
const SYN: Record<string, string[]> = {
  bg: ["background"], backround: ["background"], bkg: ["background"],
  photo: ["image", "photo"], photos: ["image", "photo"], pic: ["image", "photo"], pics: ["image"], picture: ["image", "photo"], pictures: ["image"], img: ["image"], images: ["image"], selfie: ["photo", "image"],
  jpeg: ["jpg"], jpgs: ["jpg"], pngs: ["png"],
  doc: ["word"], docx: ["word"], document: ["pdf", "word"], documents: ["pdf", "word"],
  xls: ["excel"], xlsx: ["excel"], sheet: ["excel", "spreadsheet"], sheets: ["excel", "spreadsheet"], spreadsheet: ["excel", "spreadsheet"],
  ppt: ["powerpoint"], pptx: ["powerpoint"], slides: ["powerpoint"],
  song: ["audio", "mp3", "music"], songs: ["audio", "mp3"], music: ["audio", "mp3", "music"], sound: ["audio", "mp3", "sound"], voice: ["voice", "audio"], ringtone: ["audio", "trim"], karaoke: ["vocal"], vocals: ["vocal"], singer: ["vocal"],
  clip: ["video"], movie: ["video"], mov: ["video"], reel: ["video"], reels: ["video"],
  smaller: ["compress", "reduce"], small: ["compress", "reduce"], shrink: ["compress", "reduce"], reduce: ["compress", "reduce"], decrease: ["compress", "reduce"], lighter: ["compress"], kb: ["compress", "kb"], mb: ["compress"], size: ["compress", "resize", "size"],
  combine: ["merge", "join"], join: ["merge", "join"], joining: ["merge"], together: ["merge"],
  cut: ["trim", "split", "crop", "cut"], separate: ["split"], divide: ["split"], break: ["split"],
  erase: ["remove"], delete: ["remove", "delete"], clean: ["remove"], hide: ["blur", "mask", "redact"],
  signature: ["sign", "signature"], esign: ["sign"],
  password: ["password", "protect"], lock: ["protect"], unlock: ["unlock"], secure: ["protect"],
  turn: ["rotate"], sideways: ["rotate"], upside: ["rotate", "flip"],
  fix: ["enhance", "repair"], improve: ["enhance"], brighten: ["enhance"], dark: ["enhance"], blurry: ["enhance", "upscale", "sharpen"], hd: ["upscale", "enhance"], quality: ["upscale", "enhance"], bigger: ["upscale", "resize"], larger: ["upscale", "resize"],
  negative: ["invert"], mirror: ["invert", "flip"],
  scan: ["scan", "ocr"], text: ["text"], read: ["ocr", "text"], extract: ["to", "extract", "ocr"],
  send: ["send", "share"], transfer: ["send", "share"], share: ["share", "send"], bluetooth: ["send"], airdrop: ["send"], paste: ["share", "code"],
  menu: ["menu"], restaurant: ["menu"], hotel: ["menu"], shop: ["shop", "product"], store: ["shop", "product"], product: ["product"], business: ["business", "product", "contact"],
  qrcode: ["qr"], hanger: ["door", "hanger"], hangers: ["door", "hanger"], flyer: ["hanger", "qr"], pamphlet: ["hanger"], leaflet: ["hanger"], handout: ["hanger"], halftone: ["picture", "qr"], artistic: ["picture", "art"], visual: ["picture"], barcode: ["barcode"],
  gform: ["google", "form"], googleform: ["google", "form"], forms: ["form"], survey: ["form", "survey"], questionnaire: ["form"], mcq: ["quiz", "form"], quiz: ["quiz", "form"], gs: ["gs", "apps", "script"], appscript: ["apps", "script"],
  gif: ["gif"], meme: ["meme"], logo: ["logo", "svg", "favicon"], icon: ["favicon", "icon"], vector: ["svg"],
  loan: ["emi"], interest: ["emi", "fd", "sip"], tax: ["tax", "gst"], invoice: ["invoice", "bill"], bill: ["invoice"], salary: ["tax"],
  aadhar: ["aadhaar"], adhar: ["aadhaar"], adhaar: ["aadhaar"], visa: ["passport"], exam: ["kb", "passport", "signature"], form: ["kb", "fill"],
  json: ["json"], html: ["html"], code: ["code"], regex: ["regex"], jwt: ["jwt"], diff: ["diff"], compare: ["compare", "diff"],
  "3d": ["3d", "model"], stl: ["stl"], glb: ["glb"],
  record: ["recorder", "record"], recording: ["recorder"], screen: ["screen"],
  watermark: ["watermark"], stamp: ["watermark"],
  ocr: ["ocr"], heic: ["heic"], iphone: ["heic"],
};

type Field = { words: string[]; w: number };
interface Indexed { tool: Tool; fields: Field[]; nameWords: string[]; nameText: string }

export const norm = (s: string) => s.toLowerCase()
  .replace(/&/g, " and ")
  .replace(/(\d)\s*(kb|mb)\b/g, "$1 $2")      // "50kb" -> "50 kb"
  .replace(/[^a-z0-9ऀ-ൿ]+/g, " ")
  .trim();
const words = (s: string) => norm(s).split(" ").filter(Boolean);

const index: Indexed[] = tools.map((t) => ({
  tool: t,
  nameWords: words(t.name),
  nameText: norm(t.name),
  fields: [
    { words: words(t.name), w: 5 },
    { words: words(t.slug.replace(/-/g, " ")), w: 4 },
    { words: t.keywords.flatMap(words), w: 3 },
    { words: words(t.category), w: 2 },
    { words: words(t.description), w: 1 },
  ],
}));

const vocab = [...new Set(index.flatMap((x) => x.fields.flatMap((f) => f.words)))];

function edit(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // transposition ("comrpess")
      cur.push(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] ? Math.min(v, (prev[j - 2] ?? 0) + 1) : v);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** How well one query word matches one tool word (0 = not at all). */
function wordMatch(q: string, w: string): number {
  if (q === w) return 1;
  if (q.length >= 2 && w.startsWith(q)) return q.length >= 3 ? 0.9 : 0.6;   // typing in progress: "comp" -> "compress"
  if (w.length >= 4 && q.startsWith(w)) return 0.8;                          // "compressing" -> "compress"
  if (/\d/.test(q) || q.length < 4) return 0;
  const max = q.length >= 7 ? 2 : 1;
  const d = edit(q, w, max);
  return d <= max ? (d === 1 ? 0.75 : 0.6) : 0;
}

/** Words a query word stands for: itself (full weight) and its everyday synonyms (a bit less). */
function variants(q: string): [string, number][] {
  const out: [string, number][] = [[q, 1]];
  for (const s of SYN[q] ?? []) if (s !== q) out.push([s, 0.92]);
  return out;
}

export interface Hit { tool: Tool; score: number }
export interface SearchResult { hits: Hit[]; corrected: string | null }

export function searchTools(query: string, limit = 12): SearchResult {
  const all = words(query);
  const qs = all.filter((w) => !STOP.has(w));
  const terms = qs.length ? qs : all;
  if (!terms.length) return { hits: [], corrected: null };
  const qNorm = terms.join(" ");

  const scored: (Hit & { covered: number })[] = [];
  for (const x of index) {
    let score = 0, covered = 0;
    const pos: number[] = [];
    for (const q of terms) {
      let best = 0, bestPos = -1;
      for (const [v, vw] of variants(q)) {
        for (const f of x.fields) {
          for (const w of f.words) {
            const m = wordMatch(v, w) * vw;
            if (!m) continue;
            const s = m * f.w;
            if (s > best) { best = s; bestPos = f.w === 5 ? x.nameWords.indexOf(w) : -1; }
          }
        }
      }
      if (best > 0) { covered++; score += best; }
      pos.push(bestPos);
    }
    if (!covered) continue;
    // Bonuses: the whole query is in the name, the words appear in the name in the same order ("pdf to word" vs "word to pdf").
    if (x.nameText.includes(qNorm)) score += 6;
    const inName = pos.filter((p) => p >= 0);
    if (inName.length >= 2 && inName.every((p, i) => i === 0 || p > inName[i - 1])) score += 3;
    if (terms.length === 1 && x.nameWords[0] && wordMatch(terms[0], x.nameWords[0]) >= 0.9) score += 1.5;
    if (x.tool.popular) score += 0.6;
    scored.push({ tool: x.tool, score, covered });
  }
  const maxCovered = Math.max(0, ...scored.map((s) => s.covered));
  // Prefer tools that match every word; fall back to the best partial matches.
  const pool = scored.filter((s) => s.covered >= Math.max(1, maxCovered - (terms.length >= 3 ? 1 : 0)));
  pool.sort((a, b) => b.covered - a.covered || b.score - a.score);
  const hits = pool.slice(0, limit).map(({ tool, score }) => ({ tool, score }));

  // "Did you mean": a word that is not a real word in our list, but is one typo away from one.
  let changed = false;
  const fixed = all.map((q) => {
    if (STOP.has(q) || SYN[q] || q.length < 4 || /\d/.test(q) || vocab.includes(q) || vocab.some((w) => w.startsWith(q))) return q;
    let best = q, bd = 3;
    for (const w of vocab) { const d = edit(q, w, 2); if (d < bd && d <= (q.length >= 7 ? 2 : 1)) { bd = d; best = w; } }
    if (best !== q) changed = true;
    return best;
  });
  return { hits, corrected: changed && hits.length ? fixed.join(" ") : null };
}
