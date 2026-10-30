export type Category = "PDF" | "Image" | "Video" | "AI" | "Developer" | "Utility";

// AI tools are hidden unless NEXT_PUBLIC_ENABLE_AI=true (their code stays in the repo).
export const AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI === "true";
const AI_SLUGS = new Set(["pdf-summarizer"]);

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: Category;
  popular?: boolean;
  keywords: string[];
}

const allTools: ToolMeta[] = [
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one file, in the order you choose.", category: "PDF", popular: true, keywords: ["combine", "join", "pdf"] },
  { slug: "split-pdf", name: "Split PDF", description: "Extract page ranges or split every page into its own PDF.", category: "PDF", keywords: ["extract", "pages", "pdf"] },
  { slug: "compress-pdf", name: "Compress PDF", description: "Shrink PDF size by re-packing and optimising it, right in your browser.", category: "PDF", popular: true, keywords: ["reduce", "size", "pdf"] },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Turn JPG and PNG images into a single PDF document.", category: "PDF", popular: true, keywords: ["image", "convert", "pdf"] },
  { slug: "compress-image", name: "Compress Image", description: "Compress to an exact size like 50 KB, 100 KB or 200 KB.", category: "Image", popular: true, keywords: ["reduce", "kb", "jpg", "exact size"] },
  { slug: "resize-image", name: "Resize Image", description: "Resize by pixels or percentage, with passport and exam presets.", category: "Image", popular: true, keywords: ["dimensions", "passport", "exam"] },
  { slug: "remove-background", name: "Background Remover", description: "Remove image backgrounds automatically, right on your device.", category: "Image", popular: true, keywords: ["bg", "transparent", "cutout"] },
  { slug: "watermark-remover", name: "Watermark Remover", description: "Erase watermarks from images you own or are authorised to edit.", category: "Image", keywords: ["logo", "text", "stamp", "inpaint"] },
  { slug: "organize-pdf", name: "Organize PDF Pages", description: "Rotate, reorder and delete PDF pages with a visual preview.", category: "PDF", keywords: ["rotate", "reorder", "delete pages", "remove pages"] },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Convert every PDF page into a high-quality JPG image.", category: "PDF", keywords: ["convert", "image", "pages"] },
  { slug: "protect-pdf", name: "Protect PDF", description: "Lock a PDF with a password using AES encryption, locally.", category: "PDF", keywords: ["password", "encrypt", "secure"] },
  { slug: "sign-pdf", name: "Sign PDF", description: "Draw or upload your signature and place it on any page.", category: "PDF", keywords: ["signature", "esign", "sign"] },
  { slug: "image-converter", name: "Image Converter", description: "Convert images between JPG, PNG and WebP.", category: "Image", keywords: ["jpg", "png", "webp", "format"] },
  { slug: "image-cropper", name: "Image Cropper", description: "Crop with free-form or passport and exam aspect ratios.", category: "Image", keywords: ["crop", "passport", "aspect ratio"] },
  { slug: "json-formatter", name: "JSON Formatter", description: "Format, minify and validate JSON with clear error messages.", category: "Developer", keywords: ["json", "validator", "beautify", "minify"] },
  { slug: "base64-encoder-decoder", name: "Base64 Encoder / Decoder", description: "Encode and decode Base64, including URL-safe and UTF-8 text.", category: "Developer", keywords: ["base64", "encode", "decode"] },
  { slug: "url-encoder-decoder", name: "URL Encoder / Decoder", description: "Percent-encode or decode URLs and query strings.", category: "Developer", keywords: ["url", "percent", "encode", "decode"] },
  { slug: "uuid-generator", name: "UUID Generator", description: "Generate random v4 UUIDs in bulk.", category: "Developer", keywords: ["uuid", "guid", "random"] },
  { slug: "jwt-decoder", name: "JWT Decoder", description: "Decode JWT headers and payloads and check expiry. Nothing is sent anywhere.", category: "Developer", keywords: ["jwt", "token", "decode"] },
  { slug: "regex-tester", name: "Regex Tester", description: "Test regular expressions with live match highlighting and groups.", category: "Developer", keywords: ["regex", "regexp", "pattern"] },
  { slug: "word-counter", name: "Word & Character Counter", description: "Count words, characters, sentences and reading time.", category: "Utility", keywords: ["words", "characters", "count", "text"] },
  { slug: "password-generator", name: "Password Generator", description: "Create strong random passwords with the secure browser RNG.", category: "Utility", keywords: ["password", "random", "secure"] },
  { slug: "unit-converter", name: "Unit Converter", description: "Convert length, weight, temperature, area, volume, speed and data.", category: "Utility", keywords: ["convert", "units", "length", "weight"] },
  { slug: "color-picker", name: "Image Color Picker", description: "Pick any colour from an image and get HEX, RGB and HSL.", category: "Utility", keywords: ["colour", "color", "hex", "eyedropper"] },
  { slug: "barcode-generator", name: "Barcode Generator", description: "Generate Code 128, EAN-13, UPC and Code 39 barcodes.", category: "Utility", keywords: ["barcode", "ean", "upc", "code128"] },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDF text, headings and paragraphs into an editable .docx.", category: "PDF", keywords: ["docx", "convert", "word"] },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Turn PDF tables and statements into an .xlsx spreadsheet.", category: "PDF", keywords: ["xlsx", "convert", "table", "excel"] },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert .docx documents to PDF in your browser.", category: "PDF", keywords: ["docx", "convert", "word"] },
  { slug: "pdf-ocr", name: "PDF OCR", description: "Extract text from scanned PDFs in English, Hindi, Tamil and more.", category: "PDF", keywords: ["ocr", "scan", "text"] },
  { slug: "pdf-summarizer", name: "PDF Summarizer", description: "Get an AI summary of any PDF in seconds.", category: "PDF", keywords: ["summary", "ai", "summarise"] },
  { slug: "passport-photo-maker", name: "Passport Photo Maker", description: "White background, exact size and a ready-to-print sheet.", category: "Image", popular: true, keywords: ["passport", "visa", "id photo", "print"] },
  { slug: "background-replacer", name: "Background Replacer", description: "Swap the background with a colour, gradient or your own image.", category: "Image", keywords: ["background", "change", "replace"] },
  { slug: "image-upscaler", name: "Image Upscaler", description: "Enlarge images 2\u00d7, 3\u00d7 or 4\u00d7 with smooth, sharpened results.", category: "Image", keywords: ["enlarge", "upscale", "resolution"] },
  { slug: "image-to-text", name: "Image to Text (OCR)", description: "Extract text from photos and screenshots in 8 languages.", category: "Image", keywords: ["ocr", "text", "scan"] },
  { slug: "video-compressor", name: "Video Compressor", description: "Shrink video file size while keeping it watchable.", category: "Video", keywords: ["compress", "reduce", "mp4"] },
  { slug: "video-trimmer", name: "Video Trimmer", description: "Cut a clip out of a video by start and end time.", category: "Video", keywords: ["cut", "trim", "clip"] },
  { slug: "video-converter", name: "Video Converter", description: "Convert videos between MP4, WebM and MKV.", category: "Video", keywords: ["convert", "mp4", "webm"] },
  { slug: "video-to-gif", name: "Video to GIF", description: "Turn a moment from a video into an animated GIF.", category: "Video", keywords: ["gif", "animated"] },
  { slug: "video-to-mp3", name: "Video to MP3", description: "Extract the audio track from any video as an MP3.", category: "Video", keywords: ["audio", "mp3", "extract"] },
  { slug: "video-thumbnail", name: "Video Thumbnail Generator", description: "Capture the perfect frame from a video as a JPG.", category: "Video", keywords: ["thumbnail", "frame", "screenshot"] },
  { slug: "text-summarizer", name: "Text Summarizer", description: "Condense long text into a clear summary with AI.", category: "AI", keywords: ["summary", "ai", "tldr"] },
  { slug: "grammar-corrector", name: "Grammar Corrector", description: "Fix grammar, spelling and tone with AI.", category: "AI", keywords: ["grammar", "spelling", "proofread"] },
  { slug: "image-caption-generator", name: "Image Caption Generator", description: "AI captions, alt text and hashtags for any picture.", category: "AI", keywords: ["caption", "alt text", "instagram"] },
  { slug: "resume-builder", name: "Resume Builder", description: "Build an ATS-friendly resume PDF with optional AI polish.", category: "AI", keywords: ["cv", "resume", "job"] },
  { slug: "ai-background-generator", name: "AI Background Generator", description: "Describe a scene and place your subject in it.", category: "AI", keywords: ["background", "scene", "generate"] },
  { slug: "screenshot-editor", name: "Screenshot Editor", description: "Annotate screenshots with arrows, boxes, text and blur.", category: "Utility", keywords: ["screenshot", "annotate", "blur"] },
  { slug: "alternate-mix-pdf", name: "Alternate & Mix PDF", description: "Interleave pages from two or more PDFs, such as fronts and backs.", category: "PDF", keywords: ["interleave", "duplex", "scan", "mix"] },
  { slug: "split-pdf-in-half", name: "Split PDF in Half", description: "Cut every page in two for scans with two pages per image.", category: "PDF", keywords: ["book scan", "halves", "two pages"] },
  { slug: "split-pdf-by-size", name: "Split PDF by Size", description: "Split a PDF into parts that each stay under a file size.", category: "PDF", keywords: ["email", "size limit", "parts", "mb"] },
  { slug: "split-pdf-by-text", name: "Split PDF by Text", description: "Start or end a new file wherever a page contains your text.", category: "PDF", keywords: ["chapter", "invoice", "find text"] },
  { slug: "split-pdf-by-bookmarks", name: "Split PDF by Bookmarks", description: "Break a PDF into chapters using its table of contents.", category: "PDF", keywords: ["chapters", "outline", "toc"] },
  { slug: "pdf-to-zip", name: "PDF to ZIP", description: "Turn every page into its own PDF inside one ZIP file.", category: "PDF", keywords: ["pages", "zip", "separate"] },
  { slug: "rotate-pdf", name: "Rotate PDF", description: "Rotate all, odd, even or chosen pages by 90, 180 or 270 degrees.", category: "PDF", keywords: ["turn", "sideways", "orientation"] },
  { slug: "flip-pdf", name: "Flip PDF", description: "Mirror every page left to right or top to bottom.", category: "PDF", keywords: ["mirror", "reverse"] },
  { slug: "multiple-pages-per-sheet", name: "Multiple Pages per Sheet", description: "Print 2, 4, 6, 9 or 16 pages on one sheet to save paper.", category: "PDF", keywords: ["n-up", "handout", "print", "save paper"] },
  { slug: "crop-resize-pdf", name: "Crop & Resize PDF", description: "Trim margins and fit pages onto A4, Letter and other sizes.", category: "PDF", keywords: ["trim", "margins", "paper size", "a4"] },
  { slug: "watermark-pdf", name: "Add Watermark to PDF", description: "Stamp text like DRAFT or CONFIDENTIAL on every page.", category: "PDF", keywords: ["stamp", "draft", "confidential", "text"] },
  { slug: "add-page-numbers", name: "Add Page Numbers to PDF", description: "Number your pages with formats like Page 3 of 10.", category: "PDF", keywords: ["numbering", "footer", "header"] },
  { slug: "edit-pdf-details", name: "Edit PDF Details", description: "View and change the title, author and other hidden information.", category: "PDF", keywords: ["metadata", "properties", "author", "title"] },
  { slug: "redact-pdf", name: "Redact PDF", description: "Black out sensitive text so it is permanently removed.", category: "PDF", keywords: ["blackout", "censor", "hide", "private"] },
  { slug: "pdf-workflow", name: "PDF Workflow Builder", description: "Chain several PDF steps and run them on many files at once.", category: "PDF", keywords: ["batch", "automate", "chain", "recipe"] },
  { slug: "scan-to-pdf", name: "Scan to PDF", description: "Turn photos of pages into a clean, scan-style PDF.", category: "PDF", keywords: ["scanner", "document", "camera", "black and white"] },
  { slug: "image-pipeline", name: "Image Pipeline (Resize + Convert + Compress)", description: "Resize, convert and compress many photos in one go, without re-uploading between steps.", category: "Image", keywords: ["batch", "chain", "resize", "compress", "convert"] },
  { slug: "heic-to-jpg", name: "HEIC to JPG Converter", description: "Convert iPhone HEIC photos to JPG or PNG on your device.", category: "Image", keywords: ["iphone", "heif", "convert"] },
  { slug: "signature-maker", name: "Signature Maker", description: "Draw or photograph your signature and get a transparent PNG.", category: "Image", keywords: ["sign", "transparent", "png", "form"] },
  { slug: "remove-photo-details", name: "Remove Photo Details (EXIF)", description: "See and strip location, camera and date data hidden in photos.", category: "Image", keywords: ["exif", "gps", "metadata", "privacy"] },
  { slug: "mask-aadhaar", name: "Mask Aadhaar", description: "Cover the first 8 digits of an Aadhaar number in a photo or PDF.", category: "Image", keywords: ["aadhar", "masked", "privacy", "india"] },
  { slug: "fill-pdf-form", name: "Fill PDF Form", description: "Type into fillable PDF forms and download the completed file.", category: "PDF", keywords: ["form", "fields", "fillable", "acroform"] },
  { slug: "upi-qr-generator", name: "UPI QR Code Generator", description: "Create a UPI payment QR with your ID, name and amount.", category: "Utility", keywords: ["upi", "payment", "gpay", "phonepe", "india"] },
  { slug: "emi-calculator", name: "EMI Calculator", description: "Work out your monthly loan EMI, total interest and repayment schedule.", category: "Utility", keywords: ["loan", "home loan", "interest", "india"] },
  { slug: "gst-calculator", name: "GST Calculator", description: "Add or remove GST at 5%, 12%, 18%, 28% with CGST and SGST split.", category: "Utility", keywords: ["tax", "india", "invoice", "cgst"] },
  { slug: "hash-generator", name: "Hash Generator (MD5, SHA)", description: "Create MD5, SHA-1, SHA-256 and SHA-512 hashes of text or files.", category: "Developer", keywords: ["checksum", "md5", "sha256", "verify"] },
  { slug: "text-case-converter", name: "Text Case Converter", description: "Change text to UPPER, lower, Title, camelCase, snake_case and more.", category: "Developer", keywords: ["uppercase", "lowercase", "title case", "camelcase"] },
  { slug: "qr-code-generator", name: "QR Code Generator", description: "Create QR codes for links, text, Wi-Fi and more. Download as PNG.", category: "Developer", popular: true, keywords: ["qr", "barcode"] },
];

const isAi = (t: ToolMeta) => t.category === "AI" || AI_SLUGS.has(t.slug);
export const tools: ToolMeta[] = AI_ENABLED ? allTools : allTools.filter((t) => !isAi(t));
export const categories: Category[] = (["PDF", "Image", "Video", "AI", "Developer", "Utility"] as Category[]).filter((c) => tools.some((t) => t.category === c));
export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
