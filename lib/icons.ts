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

const tile = "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800";
const dot = "bg-neutral-900 dark:bg-white";
const text = "text-neutral-900 dark:text-white";

export const categoryStyle: Record<Category, { tile: string; text: string; dot: string; label: string }> = {
  PDF: { tile, text, dot, label: "PDF tools" },
  Image: { tile, text, dot, label: "Image tools" },
  Video: { tile, text, dot, label: "Video tools" },
  AI: { tile, text, dot, label: "AI tools" },
  Developer: { tile, text, dot, label: "Developer utilities" },
  Utility: { tile, text, dot, label: "Utility tools" },
};
