# ToolBox – All Your Tools in One Place

Mobile-first web toolkit. Files are processed in the browser and never uploaded.

## Tools (47)
| Category | Tools |
|---|---|
| PDF | Merge, Split, Compress, JPG to PDF, Organize pages, PDF to JPG, Protect, Sign, PDF to Word, PDF to Excel, Word to PDF, PDF OCR, PDF summariser (AI) |
| Image | Compress to exact KB, Resize, Background remover, Background replacer, Watermark remover, Converter, Cropper, Passport photo maker, Upscaler, Image to text (OCR) |
| Video (FFmpeg.wasm) | Compress, Trim, Convert, Video to GIF, Video to MP3, Thumbnail generator |
| AI | Text summariser, Grammar corrector, Image captions, Resume builder, AI background generator |
| Developer | JSON formatter, Base64, URL codec, UUID, JWT decoder, Regex tester, QR generator |
| Utility | Word counter, Password generator, Unit converter, Colour picker, Barcode generator, Screenshot editor |

Every tool lives at `/<slug>` (see `lib/tools.ts`). Almost everything runs in the browser; `npm install` copies pdf.js, FFmpeg and Tesseract into `public/vendor`. The background-removal model loads from jsDelivr on first use.

## AI features
AI tools call `POST /api/ai`, which needs a server-side key:

```bash
ANTHROPIC_API_KEY=sk-ant-...   # required
ANTHROPIC_MODEL=claude-haiku-5-5  # optional
AI_HOURLY_LIMIT=30             # optional per-IP limit
```

Without a key the AI tools show a notice and everything else keeps working.

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
