import { timingSafeEqual } from "node:crypto";
import type { Data } from "./qrTypes";

export interface Rec { type: string; d: Data; token: string; created: number; updated: number }
export const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
