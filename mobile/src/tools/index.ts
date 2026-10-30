import type { ComponentType } from "react";
import { Base64Tool, JsonFormatter, JwtDecoder, RegexTester, UrlCodec, UuidGenerator } from "./DevTools";
import { CompressImage, ImageConverter, ResizeImage } from "./ImageTools";
import { JpgToPdf, MergePdf, SplitPdf } from "./PdfTools";
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
};
