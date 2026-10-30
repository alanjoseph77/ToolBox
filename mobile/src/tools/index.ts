import type { ComponentType } from "react";
import { Base64Tool, JsonFormatter, JwtDecoder, RegexTester, UrlCodec, UuidGenerator } from "./DevTools";
import { CompressImage, ImageConverter, ResizeImage } from "./ImageTools";
import { JpgToPdf, MergePdf, SplitPdf } from "./PdfTools";
import { AddPageNumbers, AlternateMixPdf, CropResizePdf, EditPdfDetails, FlipPdf, MultiplePagesPerSheet, PdfToZip, RotatePdf, ScanToPdf, SplitPdfHalf, SplitPdfSize, WatermarkPdf } from "./PdfOpsTools";
import { PasswordGenerator, QrGenerator, UnitConverter, WordCounter } from "./UtilityTools";

/** Slugs that have a fully native screen. Every other tool opens the website tool inside the app. */
export const nativeTools: Record<string, ComponentType> = {
  "json-formatter": JsonFormatter,
  "base64-encoder-decoder": Base64Tool,
  "url-encoder-decoder": UrlCodec,
  "uuid-generator": UuidGenerator,
  "jwt-decoder": JwtDecoder,
  "regex-tester": RegexTester,
  "word-counter": WordCounter,
  "password-generator": PasswordGenerator,
  "unit-converter": UnitConverter,
  "qr-code-generator": QrGenerator,
  "merge-pdf": MergePdf,
  "split-pdf": SplitPdf,
  "jpg-to-pdf": JpgToPdf,
  "compress-image": CompressImage,
  "resize-image": ResizeImage,
  "image-converter": ImageConverter,
  "alternate-mix-pdf": AlternateMixPdf,
  "split-pdf-in-half": SplitPdfHalf,
  "split-pdf-by-size": SplitPdfSize,
  "pdf-to-zip": PdfToZip,
  "rotate-pdf": RotatePdf,
  "flip-pdf": FlipPdf,
  "multiple-pages-per-sheet": MultiplePagesPerSheet,
  "crop-resize-pdf": CropResizePdf,
  "watermark-pdf": WatermarkPdf,
  "add-page-numbers": AddPageNumbers,
  "edit-pdf-details": EditPdfDetails,
  "scan-to-pdf": ScanToPdf,
};
