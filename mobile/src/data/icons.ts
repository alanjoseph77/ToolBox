import {
  Barcode, Binary, Braces, Camera, Clapperboard, Combine, ContactRound, Crop, Droplets, FileArchive, FileImage, FileOutput,
  FileSpreadsheet, FileText, Film, Fingerprint, ImageDown, ImagePlus, Images, KeyRound, LayoutGrid, Link2, Lock, Music,
  PenLine, Pipette, QrCode, Regex, RefreshCw, Repeat, Ruler, Scaling, ScanText, Scissors, ShieldCheck, SquareSplitHorizontal,
  TextSelect, Type, Wand2, ZoomIn, Split, Wrench, type LucideIcon,
} from "lucide-react-native";

// Same icon set as the website.
export const toolIcons: Record<string, LucideIcon> = {
  "merge-pdf": Combine, "split-pdf": Split, "compress-pdf": FileArchive, "jpg-to-pdf": FileImage, "organize-pdf": LayoutGrid,
  "pdf-to-jpg": Images, "protect-pdf": Lock, "sign-pdf": PenLine, "pdf-to-word": FileText, "pdf-to-excel": FileSpreadsheet,
  "word-to-pdf": FileOutput, "pdf-ocr": ScanText,
  "compress-image": ImageDown, "resize-image": Scaling, "remove-background": Wand2, "background-replacer": ImagePlus,
  "watermark-remover": Droplets, "image-converter": RefreshCw, "image-cropper": Crop, "passport-photo-maker": ContactRound,
  "image-upscaler": ZoomIn, "image-to-text": TextSelect,
  "video-compressor": Film, "video-trimmer": Scissors, "video-converter": Repeat, "video-to-gif": Clapperboard,
  "video-to-mp3": Music, "video-thumbnail": Camera,
  "json-formatter": Braces, "base64-encoder-decoder": Binary, "url-encoder-decoder": Link2, "uuid-generator": Fingerprint,
  "jwt-decoder": KeyRound, "regex-tester": Regex, "qr-code-generator": QrCode,
  "word-counter": Type, "password-generator": ShieldCheck, "unit-converter": Ruler, "color-picker": Pipette,
  "barcode-generator": Barcode, "screenshot-editor": SquareSplitHorizontal,
};

export const iconFor = (slug: string): LucideIcon => toolIcons[slug] ?? Wrench;
