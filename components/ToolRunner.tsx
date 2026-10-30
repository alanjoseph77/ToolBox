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
  "qr-code-generator": load(() => import("@/tools/QrGenerator")),
};

export default function ToolRunner({ slug }: { slug: string }) {
  const Tool = map[slug];
  return Tool ? <Tool /> : null;
}
