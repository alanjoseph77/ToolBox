// "Ask two questions" finder on the home page: what do you have, then what do you want to do with it.
// Plain words for people who don't know tool names. Every slug here is checked by a test.

export type HaveId = "pdf" | "photo" | "video" | "audio" | "text" | "none";
export interface Action { label: string; sub: string; slug: string; popular?: boolean }
export interface Have { id: HaveId; label: string; sub: string; more: { href: string; label: string }; actions: Action[] }

export const HAVES: Have[] = [
  { id: "pdf", label: "A PDF", sub: "or Word, Excel", more: { href: "/tools/pdf", label: "See all PDF tools" }, actions: [
    { label: "Make it smaller", sub: "Shrink the file to send or upload", slug: "compress-pdf", popular: true },
    { label: "Join PDFs into one", sub: "In the order you choose", slug: "merge-pdf" },
    { label: "Sign it", sub: "Draw your signature and place it", slug: "sign-pdf" },
    { label: "Turn it into Word", sub: "Editable .docx", slug: "pdf-to-word" },
    { label: "Turn pages into pictures", sub: "JPG of every page", slug: "pdf-to-jpg" },
    { label: "Take out some pages", sub: "Split by range or page", slug: "split-pdf" },
    { label: "Move, rotate or delete pages", sub: "See every page as a thumbnail", slug: "organize-pdf" },
    { label: "Edit text or add notes", sub: "Write, highlight, white-out", slug: "edit-pdf" },
    { label: "Add a password", sub: "Lock the PDF", slug: "protect-pdf" },
    { label: "Read text from a scan", sub: "OCR for scanned pages", slug: "pdf-ocr" },
    { label: "Word file to PDF", sub: "From .docx", slug: "word-to-pdf" },
    { label: "Excel file to PDF", sub: "From .xlsx or .csv", slug: "excel-to-pdf" },
  ] },
  { id: "photo", label: "A photo", sub: "JPG, PNG, HEIC", more: { href: "/tools/image", label: "See all image tools" }, actions: [
    { label: "Make it smaller", sub: "Lighter file, same look", slug: "compress-image", popular: true },
    { label: "Exact size in KB", sub: "Under 50 KB, 100 KB… for forms", slug: "reduce-image-size-kb" },
    { label: "Remove the background", sub: "Transparent or white", slug: "remove-background" },
    { label: "Fix a dark or dull photo", sub: "One-tap enhance", slug: "image-enhancer" },
    { label: "Passport or visa photo", sub: "Right size and background", slug: "passport-photo-maker" },
    { label: "Change the format", sub: "JPG, PNG, WebP", slug: "image-converter" },
    { label: "Crop it", sub: "Free or fixed ratio", slug: "image-cropper" },
    { label: "Change width and height", sub: "Resize in pixels or %", slug: "resize-image" },
    { label: "Put photos in a PDF", sub: "One page per photo", slug: "jpg-to-pdf" },
    { label: "Get the text out", sub: "Photo to text", slug: "image-to-text" },
    { label: "Turn it into a QR code", sub: "Your photo inside a QR that scans", slug: "picture-qr-code" },
    { label: "Make a die-cut sticker", sub: "Cut-out shape with a border and cut line", slug: "die-cut-card-maker" },
    { label: "Hide Aadhaar number", sub: "Mask the first 8 digits", slug: "mask-aadhaar" },
    { label: "Blur faces", sub: "Before you post it", slug: "blur-face" },
  ] },
  { id: "video", label: "A video", sub: "MP4, MOV", more: { href: "/tools/video", label: "See all video tools" }, actions: [
    { label: "Make it smaller", sub: "To send on WhatsApp or email", slug: "video-compressor", popular: true },
    { label: "Cut out a part", sub: "Keep only what you want", slug: "video-trimmer" },
    { label: "Get the sound as MP3", sub: "Save the song or speech", slug: "video-to-mp3" },
    { label: "Make a GIF", sub: "From any part of the clip", slug: "video-to-gif" },
    { label: "Remove the sound", sub: "Silent video, same quality", slug: "mute-video" },
    { label: "Change the format", sub: "MP4, WebM, MOV", slug: "video-converter" },
    { label: "Save a frame as a picture", sub: "Thumbnail or still", slug: "video-thumbnail" },
  ] },
  { id: "audio", label: "Audio", sub: "Song, voice note", more: { href: "/tools/audio", label: "See all audio tools" }, actions: [
    { label: "Cut a part or ringtone", sub: "Pick start and end", slug: "audio-trimmer", popular: true },
    { label: "Remove the vocals", sub: "Karaoke track", slug: "vocal-remover" },
    { label: "Change the format", sub: "MP3, M4A, WAV", slug: "audio-converter" },
    { label: "Make it smaller", sub: "Lower bitrate", slug: "audio-compressor" },
    { label: "Faster or slower", sub: "Voice stays natural", slug: "audio-speed-changer" },
    { label: "Join clips together", sub: "Into one MP3", slug: "merge-audio" },
    { label: "Record my voice", sub: "Save as a file or MP3", slug: "voice-recorder" },
  ] },
  { id: "text", label: "Text or code", sub: "Notes, JSON, HTML", more: { href: "/tools/developer", label: "See all developer tools" }, actions: [
    { label: "Share it with an ID", sub: "Anyone with the ID can read it", slug: "code-share", popular: true },
    { label: "Count words", sub: "Words, characters, reading time", slug: "word-counter" },
    { label: "Compare two versions", sub: "See what changed", slug: "text-diff" },
    { label: "Change UPPER / lower case", sub: "Title case and more", slug: "text-case-converter" },
    { label: "Make it a PDF", sub: "Plain text to PDF", slug: "text-to-pdf" },
    { label: "Format JSON", sub: "Pretty, minify, check", slug: "json-formatter" },
    { label: "Try HTML, CSS and JS", sub: "Live preview", slug: "html-code-playground" },
    { label: "Make a QR code of it", sub: "Text or link", slug: "qr-code-generator" },
  ] },
  { id: "none", label: "Nothing yet", sub: "QR, calculators", more: { href: "/tools/utility", label: "See all everyday tools" }, actions: [
    { label: "Make a QR code", sub: "Menu, links, business card…", slug: "qr-studio", popular: true },
    { label: "Make a Google Form or quiz", sub: "From your list of questions", slug: "google-form-generator" },
    { label: "QR code for a product", sub: "Photo, price, order on WhatsApp", slug: "product-qr" },
    { label: "Print an offer hanger", sub: "Door-handle card with a QR code", slug: "door-hanger-maker" },
    { label: "Send files to another phone", sub: "With a 6-digit code", slug: "send-files" },
    { label: "Work out a loan EMI", sub: "Monthly EMI and interest", slug: "emi-calculator" },
    { label: "Add or remove GST", sub: "CGST and SGST split", slug: "gst-calculator" },
    { label: "Make a GST invoice", sub: "Download as PDF", slug: "invoice-generator" },
    { label: "Work out income tax", sub: "Old and new regime", slug: "income-tax-calculator" },
    { label: "Make a strong password", sub: "One tap", slug: "password-generator" },
    { label: "Convert units", sub: "Length, weight, temperature", slug: "unit-converter" },
    { label: "Record my screen", sub: "Save as a video", slug: "screen-recorder" },
  ] },
];

/** Which question-1 answer a file belongs to. */
export function haveOf(file: { name: string; type: string }): HaveId | null {
  const n = file.name.toLowerCase(), t = (file.type || "").toLowerCase();
  if (t === "application/pdf" || /\.(pdf|docx?|xlsx?|csv|pptx?)$/.test(n)) return "pdf";
  if (t.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/.test(n)) return "photo";
  if (t.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi|3gp)$/.test(n)) return "video";
  if (t.startsWith("audio/") || /\.(mp3|m4a|wav|aac|ogg|opus|flac|amr)$/.test(n)) return "audio";
  if (t.startsWith("text/") || /\.(txt|md|json|html?|css|js|ts|xml|csv)$/.test(n)) return "text";
  return null;
}
