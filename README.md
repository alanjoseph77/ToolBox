# ToolBox – All Your Tools in One Place

Mobile-first web toolkit. Files are processed in the browser and never uploaded.

## Phase 1 (MVP) tools
| Route | Tool |
|---|---|
| `/merge-pdf` | Merge PDF |
| `/split-pdf` | Split PDF |
| `/compress-pdf` | Compress PDF (re-pack and strip metadata) |
| `/jpg-to-pdf` | JPG/PNG to PDF |
| `/compress-image` | Compress image to an exact KB target |
| `/resize-image` | Resize image, with passport/exam presets |
| `/remove-background` | AI background remover (model loaded in-browser from a CDN) |
| `/watermark-remover` | Watermark remover (select area, inpaint; ownership confirmation required) |
| `/qr-code-generator` | QR code generator |

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · pdf-lib · qrcode

## Develop
```bash
npm install
npm run dev
```

Add a tool by registering it in `lib/tools.ts`, creating `tools/<Name>.tsx`, and mapping it in `components/ToolRunner.tsx`.

## Roadmap
Phase 2 accounts and limits · Phase 3 OCR, video, batch and tool chaining · Phase 4 Expo React Native app.
