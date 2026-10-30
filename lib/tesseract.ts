/* eslint-disable @typescript-eslint/no-explicit-any */
// Tesseract OCR. The engine and English data are served from /vendor; other
// languages download their data from the public tessdata host on first use.
const BASE = "/vendor/tesseract/";

export const ocrLanguages = [
  { code: "eng", label: "English" }, { code: "hin", label: "Hindi" }, { code: "tam", label: "Tamil" },
  { code: "mal", label: "Malayalam" }, { code: "tel", label: "Telugu" }, { code: "kan", label: "Kannada" },
  { code: "ben", label: "Bengali" }, { code: "mar", label: "Marathi" },
];

function loadScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) return resolve((window as any).Tesseract);
    const s = document.createElement("script");
    s.src = BASE + "tesseract.min.js";
    s.onload = () => resolve((window as any).Tesseract);
    s.onerror = () => reject(new Error("Could not load OCR engine"));
    document.head.appendChild(s);
  });
}

export async function createOcr(lang: string, onProgress?: (p: number) => void) {
  const T = await loadScript();
  return T.createWorker(lang, 1, {
    workerPath: BASE + "worker.min.js",
    corePath: BASE + "core",
    langPath: lang === "eng" ? BASE + "lang" : "https://tessdata.projectnaptha.com/4.0.0",
    workerBlobURL: false,
    logger: (m: any) => { if (m.status === "recognizing text" && onProgress) onProgress(m.progress); },
  });
}
