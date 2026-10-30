// The PDF engine is shared by the website (lib/) and the mobile app (mobile/src/lib/).
// Edit the files in lib/, then run `node scripts/sync-pdfops.mjs` to copy them across.
import { copyFileSync } from "node:fs";
for (const f of ["pdfOps.ts", "zip.ts", "ranges.ts"]) copyFileSync(`lib/${f}`, `mobile/src/lib/${f}`);
console.log("synced pdfOps.ts, zip.ts, ranges.ts to mobile/src/lib");
