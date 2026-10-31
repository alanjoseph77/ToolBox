export type Category = "PDF" | "Image" | "Video" | "Developer" | "Utility";

export interface ToolDef {
  slug: string;
  name: string;
  description: string;
  category: Category;
  /** true = fully native screen that works offline; false = runs the website tool inside the app */
  native: boolean;
  keywords?: string;
}

export const categories: Category[] = ["PDF", "Image", "Video", "Developer", "Utility"];

export const tools: ToolDef[] = [
  // PDF
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine PDFs into one file.", category: "PDF", native: true },
  { slug: "split-pdf", name: "Split PDF", description: "Extract pages or ranges.", category: "PDF", native: true },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Turn photos into a PDF.", category: "PDF", native: true },
  { slug: "compress-pdf", name: "Compress PDF", description: "Shrink PDF file size.", category: "PDF", native: false },
  { slug: "organize-pdf", name: "Organize PDF Pages", description: "Rotate, reorder, delete pages.", category: "PDF", native: false },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Convert pages to images.", category: "PDF", native: false },
  { slug: "protect-pdf", name: "Protect PDF", description: "Lock a PDF with a password.", category: "PDF", native: false },
  { slug: "sign-pdf", name: "Sign PDF", description: "Draw and place a signature.", category: "PDF", native: false },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable .docx.", category: "PDF", native: false },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Turn PDF tables into .xlsx.", category: "PDF", native: false },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert .docx to PDF.", category: "PDF", native: false },
  { slug: "pdf-ocr", name: "PDF OCR", description: "Read text from scanned PDFs.", category: "PDF", native: false },
  { slug: "alternate-mix-pdf", name: "Alternate & Mix PDF", description: "Interleave pages, e.g. fronts and backs.", category: "PDF", native: true },
  { slug: "split-pdf-in-half", name: "Split PDF in Half", description: "Cut every page in two.", category: "PDF", native: true },
  { slug: "split-pdf-by-size", name: "Split PDF by Size", description: "Parts under a file size.", category: "PDF", native: true },
  { slug: "split-pdf-by-text", name: "Split PDF by Text", description: "Split where a page has your text.", category: "PDF", native: false },
  { slug: "split-pdf-by-bookmarks", name: "Split PDF by Bookmarks", description: "One file per chapter.", category: "PDF", native: false },
  { slug: "pdf-to-zip", name: "PDF to ZIP", description: "Every page as its own PDF.", category: "PDF", native: true },
  { slug: "rotate-pdf", name: "Rotate PDF", description: "Rotate all, odd or chosen pages.", category: "PDF", native: true },
  { slug: "flip-pdf", name: "Flip PDF", description: "Mirror every page.", category: "PDF", native: true },
  { slug: "multiple-pages-per-sheet", name: "Multiple Pages per Sheet", description: "2, 4, 6, 9 or 16 per sheet.", category: "PDF", native: true },
  { slug: "crop-resize-pdf", name: "Crop & Resize PDF", description: "Trim margins, fit paper size.", category: "PDF", native: true },
  { slug: "watermark-pdf", name: "Add Watermark", description: "Stamp text on every page.", category: "PDF", native: true },
  { slug: "add-page-numbers", name: "Add Page Numbers", description: "Page 3 of 10 and more.", category: "PDF", native: true },
  { slug: "edit-pdf-details", name: "Edit PDF Details", description: "Title, author and properties.", category: "PDF", native: true },
  { slug: "redact-pdf", name: "Redact PDF", description: "Black out sensitive text.", category: "PDF", native: false },
  { slug: "pdf-workflow", name: "PDF Workflow Builder", description: "Chain steps, run on many files.", category: "PDF", native: false },
  { slug: "scan-to-pdf", name: "Scan to PDF", description: "Camera or photos to PDF.", category: "PDF", native: true },
  { slug: "fill-pdf-form", name: "Fill PDF Form", description: "Fill in fillable PDF forms.", category: "PDF", native: true },
  // Image
  { slug: "compress-image", name: "Compress Image", description: "Hit an exact size like 50 KB.", category: "Image", native: true },
  { slug: "resize-image", name: "Resize Image", description: "Resize with passport presets.", category: "Image", native: true },
  { slug: "image-converter", name: "Image Converter", description: "Convert JPG, PNG and WebP.", category: "Image", native: true },
  { slug: "remove-background", name: "Background Remover", description: "Cut out the subject.", category: "Image", native: false },
  { slug: "background-replacer", name: "Background Replacer", description: "Swap the background.", category: "Image", native: false },
  { slug: "watermark-remover", name: "Watermark Remover", description: "Erase marks from your images.", category: "Image", native: false },
  { slug: "image-cropper", name: "Image Cropper", description: "Crop with fixed ratios.", category: "Image", native: false },
  { slug: "passport-photo-maker", name: "Passport Photo Maker", description: "White background and print sheet.", category: "Image", native: false },
  { slug: "image-upscaler", name: "Image Upscaler", description: "Enlarge 2x, 3x or 4x.", category: "Image", native: false },
  { slug: "image-to-text", name: "Image to Text (OCR)", description: "Extract text from photos.", category: "Image", native: false },
  { slug: "image-pipeline", name: "Image Pipeline", description: "Resize + convert + compress in one go.", category: "Image", native: true },
  { slug: "heic-to-jpg", name: "HEIC to JPG", description: "Convert iPhone photos.", category: "Image", native: true },
  { slug: "signature-maker", name: "Signature Maker", description: "Draw a transparent PNG signature.", category: "Image", native: true },
  { slug: "remove-photo-details", name: "Remove Photo Details", description: "Strip location and camera data.", category: "Image", native: true },
  { slug: "blur-face", name: "Blur Face & Private Areas", description: "Blur faces and private details.", category: "Image", native: false },
  { slug: "meme-generator", name: "Meme Generator", description: "Add text to any picture.", category: "Image", native: false },
  { slug: "html-to-image", name: "HTML to Image", description: "Turn HTML into a picture.", category: "Image", native: false },
  { slug: "compare-pdf", name: "Compare PDF", description: "Text differences between two PDFs.", category: "PDF", native: false },
  { slug: "pdf-to-markdown", name: "PDF to Markdown", description: "Turn a PDF into Markdown.", category: "PDF", native: false },
  { slug: "mask-aadhaar", name: "Mask Aadhaar", description: "Cover the first 8 digits.", category: "Image", native: false },
  // Video
  { slug: "video-compressor", name: "Video Compressor", description: "Shrink video file size.", category: "Video", native: false },
  { slug: "video-trimmer", name: "Video Trimmer", description: "Cut a clip from a video.", category: "Video", native: false },
  { slug: "video-converter", name: "Video Converter", description: "MP4, WebM and MKV.", category: "Video", native: false },
  { slug: "video-to-gif", name: "Video to GIF", description: "Make an animated GIF.", category: "Video", native: false },
  { slug: "video-to-mp3", name: "Video to MP3", description: "Extract audio as MP3.", category: "Video", native: false },
  { slug: "video-thumbnail", name: "Video Thumbnail", description: "Capture frames as JPG.", category: "Video", native: false },
  // Developer
  { slug: "json-formatter", name: "JSON Formatter", description: "Format, minify and validate.", category: "Developer", native: true },
  { slug: "base64-encoder-decoder", name: "Base64 Encoder / Decoder", description: "Encode and decode text.", category: "Developer", native: true },
  { slug: "url-encoder-decoder", name: "URL Encoder / Decoder", description: "Percent-encode URLs.", category: "Developer", native: true },
  { slug: "uuid-generator", name: "UUID Generator", description: "Random v4 UUIDs.", category: "Developer", native: true },
  { slug: "jwt-decoder", name: "JWT Decoder", description: "Decode tokens and check expiry.", category: "Developer", native: true },
  { slug: "regex-tester", name: "Regex Tester", description: "Test with live matches.", category: "Developer", native: true },
  { slug: "qr-code-generator", name: "QR Code Generator", description: "Make and share QR codes.", category: "Developer", native: true },
  { slug: "hash-generator", name: "Hash Generator", description: "MD5, SHA-1, SHA-256, SHA-512.", category: "Developer", native: true },
  { slug: "text-case-converter", name: "Text Case Converter", description: "camelCase, snake_case and more.", category: "Developer", native: true },
  // Utility
  { slug: "word-counter", name: "Word & Character Counter", description: "Words, characters, reading time.", category: "Utility", native: true },
  { slug: "password-generator", name: "Password Generator", description: "Strong random passwords.", category: "Utility", native: true },
  { slug: "unit-converter", name: "Unit Converter", description: "Length, weight, temperature…", category: "Utility", native: true },
  { slug: "color-picker", name: "Image Color Picker", description: "Pick colours from a photo.", category: "Utility", native: false },
  { slug: "barcode-generator", name: "Barcode Generator", description: "Code 128, EAN-13, UPC.", category: "Utility", native: false },
  { slug: "screenshot-editor", name: "Screenshot Editor", description: "Annotate and blur.", category: "Utility", native: false },
  { slug: "upi-qr-generator", name: "UPI QR Generator", description: "Payment QR with amount.", category: "Utility", native: true },
  { slug: "emi-calculator", name: "EMI Calculator", description: "Monthly loan EMI and schedule.", category: "Utility", native: true },
  { slug: "gst-calculator", name: "GST Calculator", description: "Add or remove GST.", category: "Utility", native: true },
];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
