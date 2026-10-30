import {
  Barcode, Binary, Braces, Briefcase, Camera, Clapperboard, Combine, ContactRound, Crop, Eraser, FileArchive, FileImage,
  FileOutput, FileSpreadsheet, FileText, Fingerprint, ImageDown, ImagePlus, Images, KeyRound, LayoutGrid, Link2, Lock, MessageSquareText,
  Music, Palette, PenLine, Pipette, QrCode, Regex, RefreshCw, Repeat, Ruler, Scaling, ScanText, Scissors, ShieldCheck, Sparkles,
  SpellCheck, SquareSplitHorizontal, TextSelect, Type, Wand2, ZoomIn, Film, Droplets, Split, type LucideIcon,
} from "lucide-react";
import type { Category } from "./tools";

export const toolIcons: Record<string, LucideIcon> = {
  "merge-pdf": Combine, "split-pdf": Split, "compress-pdf": FileArchive, "jpg-to-pdf": FileImage, "organize-pdf": LayoutGrid,
  "pdf-to-jpg": Images, "protect-pdf": Lock, "sign-pdf": PenLine, "pdf-to-word": FileText, "pdf-to-excel": FileSpreadsheet,
  "word-to-pdf": FileOutput, "pdf-ocr": ScanText, "pdf-summarizer": Sparkles,
  "compress-image": ImageDown, "resize-image": Scaling, "remove-background": Wand2, "background-replacer": ImagePlus,
  "watermark-remover": Droplets, "image-converter": RefreshCw, "image-cropper": Crop, "passport-photo-maker": ContactRound,
  "image-upscaler": ZoomIn, "image-to-text": TextSelect,
  "video-compressor": Film, "video-trimmer": Scissors, "video-converter": Repeat, "video-to-gif": Clapperboard,
  "video-to-mp3": Music, "video-thumbnail": Camera,
  "text-summarizer": Sparkles, "grammar-corrector": SpellCheck, "image-caption-generator": MessageSquareText,
  "resume-builder": Briefcase, "ai-background-generator": Palette,
  "json-formatter": Braces, "base64-encoder-decoder": Binary, "url-encoder-decoder": Link2, "uuid-generator": Fingerprint,
  "jwt-decoder": KeyRound, "regex-tester": Regex, "qr-code-generator": QrCode,
  "word-counter": Type, "password-generator": ShieldCheck, "unit-converter": Ruler, "color-picker": Pipette,
  "barcode-generator": Barcode, "screenshot-editor": SquareSplitHorizontal,
};

// Full class strings so Tailwind can see them.
export const categoryStyle: Record<Category, { tile: string; text: string; dot: string; label: string }> = {
  PDF: { tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300", text: "text-rose-600 dark:text-rose-300", dot: "bg-rose-500", label: "PDF tools" },
  Image: { tile: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300", text: "text-sky-600 dark:text-sky-300", dot: "bg-sky-500", label: "Image tools" },
  Video: { tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300", text: "text-violet-600 dark:text-violet-300", dot: "bg-violet-500", label: "Video tools" },
  AI: { tile: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300", text: "text-fuchsia-600 dark:text-fuchsia-300", dot: "bg-fuchsia-500", label: "AI tools" },
  Developer: { tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", text: "text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-500", label: "Developer utilities" },
  Utility: { tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500", label: "Utility tools" },
};
