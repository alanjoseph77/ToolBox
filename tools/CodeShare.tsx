"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { download } from "@/lib/files";
import { decryptText, encryptText } from "@/lib/cryptoText";

type Mode = "write" | "open";
interface Mine { id: string; token: string; expires: number }
interface Got { text: string; enc: { s: string; i: string } | null; updated: number; expires: number }
const LS = "toolbox-codeshare-tokens";
const readTokens = (): Record<string, Mine> => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const saveToken = (m: Mine) => { try { localStorage.setItem(LS, JSON.stringify({ ...readTokens(), [m.id]: m })); } catch { /* storage unavailable */ } };
const ago = (t: number) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 5 ? "just now" : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
const left = (t: number) => { const m = Math.round((t - Date.now()) / 60000); return m < 1 ? "less than a minute" : m < 90 ? `${m} min` : m < 2880 ? `${Math.round(m / 60)} hours` : `${Math.round(m / 1440)} days`; };

export default function CodeShare() {
  const [mode, setMode] = useState<Mode>("write");
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState("1d");
  const [pw, setPw] = useState("");
  const [mine, setMine] = useState<Mine | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [qr, setQr] = useState("");
  // open side
  const [idIn, setIdIn] = useState("");
  const [openId, setOpenId] = useState("");
  const [got, setGot] = useState<Got | null>(null);
  const [shown, setShown] = useState<string | null>(null);   // the readable text (decrypted if needed)
  const [pwIn, setPwIn] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [, tick] = useState(0);
  const pwRef = useRef("");

  const link = (id: string) => `${location.origin}/code-share?id=${id}`;
  const copy = (t: string, msg: string) => { navigator.clipboard?.writeText(t).then(() => setNote(msg)).catch(() => setNote("Could not copy. Select and copy it by hand.")); setTimeout(() => setNote(""), 2500); };
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
  const api = async (method: string, body?: unknown, qs = "") => {
    const r = await fetch(`/api/share${qs}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Request failed."); return j;
  };

  // ---- write side ----
  const payload = async () => (pw ? encryptText(text, pw) : { text, enc: undefined });
  const create = async () => {
    setBusy(true); setError("");
    try {
      const p = await payload(), j = await api("POST", { ...p, ttl });
      const m = { id: j.id as string, token: j.token as string, expires: j.expires as number }; saveToken(m); setMine(m);
      setQr(await QRCode.toDataURL(link(m.id), { margin: 1, width: 220 }));
    } catch (e) { fail(e); }
    setBusy(false);
  };
  const update = async () => {
    if (!mine) return; setBusy(true); setError("");
    try { const p = await payload(); await api("PUT", { id: mine.id, token: mine.token, ...p }); setNote("Updated. Anyone with the ID sees the new text within a few seconds."); setTimeout(() => setNote(""), 3000); } catch (e) { fail(e); }
    setBusy(false);
  };
  const remove = async () => {
    if (!mine) return; setBusy(true);
    try { await api("DELETE", { id: mine.id, token: mine.token }); setMine(null); setQr(""); setNote("Deleted."); } catch (e) { fail(e); }
    setBusy(false);
  };

  // ---- open side ----
  const render = useCallback(async (g: Got) => {
    if (!g.enc) { setShown(g.text); return; }
    if (!pwRef.current) { setShown(null); return; }
    try { setShown(await decryptText(g.text, g.enc, pwRef.current)); setPwErr(""); } catch { setShown(null); pwRef.current = ""; setPwErr("Wrong password."); }
  }, []);
  const load = useCallback(async (id: string, quiet = false) => {
    try { const g = (await api("GET", undefined, `?id=${encodeURIComponent(id)}`)) as Got; setGot((o) => (o && o.updated === g.updated ? o : g)); setError(""); if (!quiet || !got || got.updated !== g.updated) await render(g); }
    catch (e) { if (!quiet) { setGot(null); setShown(null); } fail(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render]);
  const openIt = (id: string) => { const clean = id.toLowerCase().replace(/[^a-z0-9]/g, ""); setMode("open"); setIdIn(clean); setOpenId(clean); setGot(null); setShown(null); setPwIn(""); pwRef.current = ""; setPwErr(""); setError(""); if (clean) load(clean); };

  useEffect(() => { const id = new URLSearchParams(location.search).get("id"); if (id) openIt(id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (mode !== "open" || !openId) return; const t = setInterval(() => load(openId, true), 4000); const c = setInterval(() => tick((n) => n + 1), 5000); return () => { clearInterval(t); clearInterval(c); }; }, [mode, openId, load]);

  const tab = (m: Mode, l: string) => <button role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }} className={`chip ${mode === m ? "chip-active" : ""}`}>{l}</button>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">{tab("write", "Write and share")}{tab("open", "Open with an ID")}</div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="cs-error">{error}</p>}
      {note && <p className="text-sm text-green-700" aria-live="polite" data-testid="cs-note">{note}</p>}

      {mode === "write" && (
        <div className="space-y-3">
          <textarea aria-label="Your text or code" data-testid="cs-text" className="input h-72 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste anything: code, notes, a link, a message…" spellCheck={false} />
          {!mine && (
            <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-3 text-sm">
              <label className="flex flex-col gap-1">Keep it for <select aria-label="How long to keep it" className="rounded-lg border px-2 py-2" value={ttl} onChange={(e) => setTtl(e.target.value)}><option value="1h">1 hour</option><option value="1d">1 day</option><option value="7d">7 days</option></select></label>
              <label className="flex min-w-[220px] flex-1 flex-col gap-1">Password (optional)<input aria-label="Password" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="Leave empty for no password" /></label>
            </div>
          )}
          {!mine
            ? <button className="btn w-full" disabled={busy || !text.trim()} onClick={create}>{busy ? "Creating…" : "Create share ID"}</button>
            : (
              <div className="space-y-3 rounded-xl border bg-white p-4" data-testid="cs-mine">
                <p className="text-sm text-neutral-500">Share this ID. Whoever has it can read your text.</p>
                <p className="font-mono text-4xl font-bold tracking-widest" data-testid="cs-id">{mine.id}</p>
                <p className="text-xs text-neutral-500">Disappears in {left(mine.expires)}. {pw ? "Locked with your password. Share the password separately." : ""}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-ghost" onClick={() => copy(mine.id, "ID copied.")}>Copy ID</button>
                  <button className="btn-ghost" onClick={() => copy(link(mine.id), "Link copied.")}>Copy link</button>
                  <button className="btn" disabled={busy || !text.trim()} onClick={update}>Update shared text</button>
                  <button className="btn-ghost text-red-700" disabled={busy} onClick={remove}>Delete now</button>
                </div>
                {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="QR code for the link" className="h-28 w-28 rounded border" />}
              </div>
            )}
          <p className="text-xs text-neutral-500">Unlike most tools here, Code Share keeps your text on our server for the time you choose, so another person can open it. With a password it is scrambled on your device first, so we cannot read it. Do not share secrets without a password.</p>
        </div>
      )}

      {mode === "open" && (
        <div className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); openIt(idIn); }}>
            <input aria-label="Share ID" data-testid="cs-idin" className="input font-mono text-lg tracking-widest" value={idIn} maxLength={6} onChange={(e) => setIdIn(e.target.value)} placeholder="6-character ID" autoCapitalize="none" autoComplete="off" />
            <button className="btn" disabled={idIn.trim().length < 6}>Open</button>
          </form>
          {got?.enc && shown === null && (
            <form className="flex flex-wrap gap-2 rounded-xl border bg-white p-3" onSubmit={(e) => { e.preventDefault(); pwRef.current = pwIn; render(got); }}>
              <p className="w-full text-sm">This text is locked. Enter the password you were given.</p>
              <input aria-label="Password to unlock" type="password" className="input flex-1" value={pwIn} onChange={(e) => setPwIn(e.target.value)} />
              <button className="btn" disabled={!pwIn}>Unlock</button>
              {pwErr && <p className="w-full text-sm text-red-600" data-testid="cs-pwerr">{pwErr}</p>}
            </form>
          )}
          {shown !== null && got && (
            <div className="space-y-2">
              <textarea readOnly aria-label="Shared text" data-testid="cs-shown" className="input h-72 font-mono text-sm" value={shown} />
              <p className="text-xs text-neutral-500">Updated {ago(got.updated)} · refreshes by itself · disappears in {left(got.expires)}</p>
              <div className="flex gap-2"><button className="btn" onClick={() => copy(shown, "Copied.")}>Copy text</button><button className="btn-ghost" onClick={() => download(new Blob([shown], { type: "text/plain" }), `share-${openId}.txt`)}>Download .txt</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
