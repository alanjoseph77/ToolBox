export type Category = "PDF" | "Image" | "Developer";

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
  { slug: "qr-code-generator", name: "QR Code Generator", description: "Create QR codes for links, text, Wi-Fi and more. Download as PNG.", category: "Developer", popular: true, keywords: ["qr", "barcode"] },
];

export const categories: Category[] = ["PDF", "Image", "Developer"];
export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
