// The PDF engine is shared by the website (lib/) and the mobile app (mobile/src/lib/).
// Edit the files in lib/, then run `node scripts/sync-pdfops.mjs` to copy them across.
import { copyFileSync } from "node:fs";
for (const f of ["pdfOps.ts", "zip.ts", "ranges.ts", "calc.ts", "textCase.ts", "hash.ts", "upi.ts", "pdfForms.ts"]) copyFileSync(`lib/${f}`, `mobile/src/lib/${f}`);
console.log("synced the shared libraries to mobile/src/lib");
