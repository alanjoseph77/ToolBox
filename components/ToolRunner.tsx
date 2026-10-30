"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const Loading = () => <p className="text-sm text-slate-500">Loading tool…</p>;
const load = (p: () => Promise<{ default: ComponentType }>) => dynamic(p, { ssr: false, loading: Loading });

const map: Record<string, ComponentType> = {
  "merge-pdf": load(() => import("@/tools/MergePdf")),
  "split-pdf": load(() => import("@/tools/SplitPdf")),
  "compress-pdf": load(() => import("@/tools/CompressPdf")),
  "jpg-to-pdf": load(() => import("@/tools/JpgToPdf")),
  "compress-image": load(() => import("@/tools/CompressImage")),
  "resize-image": load(() => import("@/tools/ResizeImage")),
  "remove-background": load(() => import("@/tools/RemoveBackground")),
  "watermark-remover": load(() => import("@/tools/WatermarkRemover")),
  "organize-pdf": load(() => import("@/tools/OrganizePdf")),
  "pdf-to-jpg": load(() => import("@/tools/PdfToJpg")),
  "protect-pdf": load(() => import("@/tools/ProtectPdf")),
  "sign-pdf": load(() => import("@/tools/SignPdf")),
  "image-converter": load(() => import("@/tools/ImageConverter")),
  "image-cropper": load(() => import("@/tools/ImageCropper")),
  "json-formatter": load(() => import("@/tools/JsonFormatter")),
  "base64-encoder-decoder": load(() => import("@/tools/Base64Tool")),
  "url-encoder-decoder": load(() => import("@/tools/UrlCodec")),
  "uuid-generator": load(() => import("@/tools/UuidGenerator")),
  "jwt-decoder": load(() => import("@/tools/JwtDecoder")),
  "regex-tester": load(() => import("@/tools/RegexTester")),
  "word-counter": load(() => import("@/tools/WordCounter")),
  "password-generator": load(() => import("@/tools/PasswordGenerator")),
  "unit-converter": load(() => import("@/tools/UnitConverter")),
  "color-picker": load(() => import("@/tools/ColorPicker")),
  "barcode-generator": load(() => import("@/tools/BarcodeGenerator")),
  "qr-code-generator": load(() => import("@/tools/QrGenerator")),
};

export default function ToolRunner({ slug }: { slug: string }) {
  const Tool = map[slug];
  return Tool ? <Tool /> : null;
}
