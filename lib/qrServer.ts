import { createHash, timingSafeEqual } from "node:crypto";
import { IMG_REF, listImages, mapImages, type Data, type QrType } from "./qrTypes";
import { delKey, getKey, setKey } from "./shareStore";

export interface Rec { type: string; d: Data; token: string; created: number; updated: number }
export const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const TTL = 365 * 24 * 3600;

const hashOf = (dataUrl: string) => createHash("sha256").update(dataUrl).digest("hex").slice(0, 12);
const refOf = (id: string, h: string) => `/api/qr/img?id=${id}&h=${h}`;
const keyOf = (id: string, h: string) => `qm:${id}:${h}`;

/** The stored-picture references used in a page's data. */
export const refsIn = (type: QrType, d: Data): string[] => [...new Set(listImages(type, d).filter((x) => IMG_REF.test(x)))];

/**
 * Saves every new picture on its own (so a page can hold many) and swaps it for a short reference.
 * A reference is kept only if it points to a picture that already belongs to THIS page; anything else is dropped.
 */
export async function externalizeImages(id: string, type: QrType, d: Data): Promise<Data> {
  const swap = new Map<string, string>();
  for (const src of new Set(listImages(type, d))) {
    const m = IMG_REF.exec(src);
    if (m) { swap.set(src, m[1] === id && (await getKey(keyOf(id, m[2]))) !== null ? src : ""); continue; }
    const h = hashOf(src); await setKey(keyOf(id, h), src, TTL); swap.set(src, refOf(id, h));
  }
  return mapImages(type.fields, d, (s) => swap.get(s) ?? "") as Data;
}

/** Deletes pictures that a page no longer uses. */
export async function dropImages(id: string, refs: string[]) {
  for (const r of refs) { const m = IMG_REF.exec(r); if (m && m[1] === id) await delKey(keyOf(id, m[2])); }
}
