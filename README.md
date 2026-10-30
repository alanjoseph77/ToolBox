# ToolBox – All Your Tools in One Place

Mobile-first web toolkit. Files are processed in the browser and never uploaded.

## Tools
| Category | Tools |
|---|---|
| PDF | Merge, Split, Compress, JPG to PDF, Organize pages (rotate/reorder/delete), PDF to JPG, Protect (AES), Sign |
| Image | Compress to exact KB, Resize (passport/exam presets), Background remover, Watermark remover, Converter (JPG/PNG/WebP), Cropper |
| Developer | JSON formatter, Base64, URL encode/decode, UUID, JWT decoder, Regex tester, QR generator |
| Utility | Word counter, Password generator, Unit converter, Image colour picker, Barcode generator |

Every tool lives at `/<slug>` (see `lib/tools.ts`). pdf.js and the background-removal model are loaded from jsDelivr at runtime.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · pdf-lib · pdf.js · qrcode · jsbarcode

## Develop
```bash
npm install
npm run dev
```

Add a tool by registering it in `lib/tools.ts`, creating `tools/<Name>.tsx`, and mapping it in `components/ToolRunner.tsx`.

## Roadmap
Phase 2 accounts and limits · Phase 3 OCR, video, batch and tool chaining · Phase 4 Expo React Native app.
