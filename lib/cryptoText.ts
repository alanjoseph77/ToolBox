// Password protection for Code Share: the text is scrambled (AES-GCM) in the browser, so the server only ever stores unreadable data.
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function key(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encryptText(text: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(password, salt), new TextEncoder().encode(text)));
  return { text: b64(data), enc: { s: b64(salt), i: b64(iv) } };
}
export async function decryptText(data: string, enc: { s: string; i: string }, password: string): Promise<string> {
  const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(enc.i) as BufferSource }, await key(password, unb64(enc.s)), unb64(data) as BufferSource);
  return new TextDecoder().decode(out);
}
