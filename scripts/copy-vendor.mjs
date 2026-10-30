// Copies heavy browser-side engines (pdf.js, FFmpeg, Tesseract) from node_modules into
// public/vendor so they are served from our own origin. Runs on every `npm install`.
import { cpSync, mkdirSync, existsSync } from "node:fs";

const jobs = [
  ["node_modules/pdfjs-dist/build/pdf.min.mjs", "public/vendor/pdfjs/pdf.min.mjs"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.min.mjs"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js", "public/vendor/ffmpeg/ffmpeg.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js", "public/vendor/ffmpeg/814.ffmpeg.js"],
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js", "public/vendor/ffmpeg/ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm", "public/vendor/ffmpeg/ffmpeg-core.wasm"],
  ["node_modules/tesseract.js/dist/tesseract.min.js", "public/vendor/tesseract/tesseract.min.js"],
  ["node_modules/tesseract.js/dist/worker.min.js", "public/vendor/tesseract/worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "public/vendor/tesseract/core/tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "public/vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "public/vendor/tesseract/lang/eng.traineddata.gz"],
];

for (const [from, to] of jobs) {
  if (!existsSync(from)) { console.warn(`copy-vendor: missing ${from}, skipped`); continue; }
  mkdirSync(to.slice(0, to.lastIndexOf("/")), { recursive: true });
  cpSync(from, to);
}
