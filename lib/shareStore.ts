// Storage for Code Share. Uses Upstash Redis / Vercel KV over plain HTTPS when its keys are set.
// Without keys it falls back to server memory, which is only good for local testing (a serverless host forgets it).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const storeConfigured = Boolean(URL_ && TOKEN);
export const storeUsable = storeConfigured || process.env.NODE_ENV !== "production";

const mem = ((globalThis as unknown as { __cs?: Map<string, { v: string; exp: number }> }).__cs ??= new Map());

async function redis(args: (string | number)[]): Promise<unknown> {
  const r = await fetch(URL_!, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`store ${r.status}`);
  return ((await r.json()) as { result: unknown }).result;
}

export async function getKey(key: string): Promise<string | null> {
  if (storeConfigured) return ((await redis(["GET", key])) as string | null) ?? null;
  const e = mem.get(key); if (!e) return null;
  if (e.exp < Date.now()) { mem.delete(key); return null; }
  return e.v;
}
/** Stores a value that disappears after ttlSeconds. With nx it only succeeds when the key is new. */
export async function setKey(key: string, value: string, ttlSeconds: number, nx = false): Promise<boolean> {
  if (storeConfigured) return (await redis(nx ? ["SET", key, value, "EX", ttlSeconds, "NX"] : ["SET", key, value, "EX", ttlSeconds])) === "OK";
  if (nx && (await getKey(key)) !== null) return false;
  mem.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 }); return true;
}
export async function delKey(key: string): Promise<void> {
  if (storeConfigured) await redis(["DEL", key]); else mem.delete(key);
}
