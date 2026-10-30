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
  // Utility
  { slug: "word-counter", name: "Word & Character Counter", description: "Words, characters, reading time.", category: "Utility", native: true },
  { slug: "password-generator", name: "Password Generator", description: "Strong random passwords.", category: "Utility", native: true },
  { slug: "unit-converter", name: "Unit Converter", description: "Length, weight, temperature…", category: "Utility", native: true },
  { slug: "color-picker", name: "Image Color Picker", description: "Pick colours from a photo.", category: "Utility", native: false },
  { slug: "barcode-generator", name: "Barcode Generator", description: "Code 128, EAN-13, UPC.", category: "Utility", native: false },
  { slug: "screenshot-editor", name: "Screenshot Editor", description: "Annotate and blur.", category: "Utility", native: false },
];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
