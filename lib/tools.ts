export type Category = "PDF" | "Image" | "Developer" | "Utility";

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: Category;
  popular?: boolean;
  keywords: string[];
}

export const tools: ToolMeta[] = [
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one file, in the order you choose.", category: "PDF", popular: true, keywords: ["combine", "join", "pdf"] },
  { slug: "split-pdf", name: "Split PDF", description: "Extract page ranges or split every page into its own PDF.", category: "PDF", keywords: ["extract", "pages", "pdf"] },
  { slug: "compress-pdf", name: "Compress PDF", description: "Shrink PDF size by re-packing and optimising it, right in your browser.", category: "PDF", popular: true, keywords: ["reduce", "size", "pdf"] },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Turn JPG and PNG images into a single PDF document.", category: "PDF", popular: true, keywords: ["image", "convert", "pdf"] },
  { slug: "compress-image", name: "Compress Image", description: "Compress to an exact size like 50 KB, 100 KB or 200 KB.", category: "Image", popular: true, keywords: ["reduce", "kb", "jpg", "exact size"] },
  { slug: "resize-image", name: "Resize Image", description: "Resize by pixels or percentage, with passport and exam presets.", category: "Image", popular: true, keywords: ["dimensions", "passport", "exam"] },
  { slug: "remove-background", name: "Background Remover", description: "Remove image backgrounds with AI that runs on your device.", category: "Image", popular: true, keywords: ["bg", "transparent", "cutout"] },
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
  { slug: "qr-code-generator", name: "QR Code Generator", description: "Create QR codes for links, text, Wi-Fi and more. Download as PNG.", category: "Developer", popular: true, keywords: ["qr", "barcode"] },
];

export const categories: Category[] = ["PDF", "Image", "Developer", "Utility"];
export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
