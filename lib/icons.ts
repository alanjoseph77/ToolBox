import {
  Barcode, Binary, Braces, Briefcase, Camera, Clapperboard, Combine, ContactRound, Crop, Eraser, FileArchive, FileImage,
  FileOutput, FileSpreadsheet, FileText, Fingerprint, ImageDown, ImagePlus, Images, KeyRound, LayoutGrid, Link2, Lock, MessageSquareText,
  Music, Palette, PenLine, Pipette, QrCode, Regex, RefreshCw, Repeat, Ruler, Scaling, ScanText, Scissors, ShieldCheck, Sparkles,
  SpellCheck, SquareSplitHorizontal, Aperture, Calculator, CaseSensitive, FileX2, Hash, IdCard, IndianRupee, ListChecks, PenTool, Percent, TextCursorInput, Archive, Bookmark, Columns2, EyeOff, FileCog, FlipHorizontal2, Grid2x2, HardDrive, ListOrdered, Maximize, RotateCw, ScanLine, Shuffle, Stamp, TextSearch, Workflow, TextSelect, Type, Wand2, ZoomIn, Film, Droplets, Split, type LucideIcon,
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
  "alternate-mix-pdf": Shuffle,
  "split-pdf-in-half": Columns2,
  "split-pdf-by-size": HardDrive,
  "split-pdf-by-text": TextSearch,
  "split-pdf-by-bookmarks": Bookmark,
  "pdf-to-zip": Archive,
  "rotate-pdf": RotateCw,
  "flip-pdf": FlipHorizontal2,
  "multiple-pages-per-sheet": Grid2x2,
  "crop-resize-pdf": Maximize,
  "watermark-pdf": Stamp,
  "add-page-numbers": ListOrdered,
  "edit-pdf-details": FileCog,
  "redact-pdf": EyeOff,
  "pdf-workflow": Workflow,
  "scan-to-pdf": ScanLine,
  "image-pipeline": ListChecks,
  "heic-to-jpg": Aperture,
  "signature-maker": PenTool,
  "remove-photo-details": FileX2,
  "mask-aadhaar": IdCard,
  "fill-pdf-form": TextCursorInput,
  "upi-qr-generator": IndianRupee,
  "emi-calculator": Calculator,
  "gst-calculator": Percent,
  "hash-generator": Hash,
  "text-case-converter": CaseSensitive,
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
