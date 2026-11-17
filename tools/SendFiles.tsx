"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { download, formatBytes } from "@/lib/files";
import PasteButton, { usePasteTarget } from "@/components/PasteButton";

// Files travel straight from one device to the other (WebRTC). A small "matchmaker" service only introduces the two
// devices using the code; it never sees the files. Set NEXT_PUBLIC_PEER_* to use your own matchmaker, NEXT_PUBLIC_TURN_* for a relay.
const PREFIX = "toolbox-";
const CHUNK = 64 * 1024;

function peerOptions() {
  // each NEXT_PUBLIC_ name must be written out in full here, or Next.js does not put its value into the page
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL, host = process.env.NEXT_PUBLIC_PEER_HOST;
  const ice: any[] = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }];
  if (turnUrl) ice.push({ urls: turnUrl, username: process.env.NEXT_PUBLIC_TURN_USER, credential: process.env.NEXT_PUBLIC_TURN_PASS });
  const o: any = { debug: 0, config: { iceServers: ice } };
  if (host) { o.host = host; o.port = Number(process.env.NEXT_PUBLIC_PEER_PORT || 443); o.path = process.env.NEXT_PUBLIC_PEER_PATH || "/"; o.secure = process.env.NEXT_PUBLIC_PEER_SECURE !== "false"; }
  return o;
}
const makeCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
const fmtCode = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pct = (a: number, b: number) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);

interface Xfer { id: number; status: "asking" | "sending" | "done" | "declined" | "lost"; sent: number; total: number }
interface Got { name: string; size: number; type: string; got: number; blob?: Blob }

async function openPeer(id?: string): Promise<any> {
  const { Peer } = await import("peerjs");
  return new Promise((res, rej) => { const p = id ? new Peer(id, peerOptions()) : new Peer(peerOptions()); p.on("open", () => res(p)); p.on("error", (e: any) => { p.destroy(); rej(e); }); });
}

export default function SendFiles() {
  const [mode, setMode] = useState<"send" | "receive">("send");
  const [error, setError] = useState("");
  // ---- send ----
  const [files, setFiles] = useState<File[]>([]);
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [xfers, setXfers] = useState<Xfer[]>([]);
  const [note, setNote] = useState("");
  const peerRef = useRef<any>(null);
  const conns = useRef<Map<number, any>>(new Map());
  const filesRef = useRef<File[]>([]);
  const wake = useRef<any>(null);
  // ---- receive ----
  const [codeIn, setCodeIn] = useState("");
  const [phase, setPhase] = useState<"idle" | "connecting" | "waiting" | "receiving" | "done">("idle");
  const [rx, setRx] = useState<Got[]>([]);
  const rxPeer = useRef<any>(null);

  const upd = (id: number, patch: Partial<Xfer>) => setXfers((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const stopAll = useCallback(() => {
    peerRef.current?.destroy(); peerRef.current = null; rxPeer.current?.destroy(); rxPeer.current = null; conns.current.clear();
    wake.current?.release?.().catch?.(() => {}); wake.current = null;
  }, []);
  useEffect(() => stopAll, [stopAll]);

  // ================= send =================
  const sendAll = async (id: number) => {
    const conn = conns.current.get(id), list = filesRef.current; if (!conn) return;
    const total = list.reduce((n, f) => n + f.size, 0); let sent = 0;
    upd(id, { status: "sending", total, sent: 0 });
    try {
      conn.send({ t: "meta", files: list.map((f) => ({ name: f.name, size: f.size, type: f.type })) });
      for (let i = 0; i < list.length; i++) {
        conn.send({ t: "start", i });
        for (let off = 0; off < list[i].size; off += CHUNK) {
          const buf = await list[i].slice(off, off + CHUNK).arrayBuffer();
          while (conn.dataChannel && conn.dataChannel.bufferedAmount > 4 * 1024 * 1024) { if (!conn.open) throw new Error("closed"); await sleep(15); }
          if (!conn.open) throw new Error("closed");
          conn.send(buf); sent += buf.byteLength; if ((off / CHUNK) % 8 === 0) upd(id, { sent });
        }
        conn.send({ t: "end", i });
      }
      conn.send({ t: "done" }); upd(id, { status: "done", sent: total });
    } catch { upd(id, { status: "lost" }); }
  };

  const startSharing = async () => {
    setError(""); filesRef.current = files;
    try {
      let p: any = null, c = "";
      for (let i = 0; i < 6 && !p; i++) { c = makeCode(); try { p = await openPeer(PREFIX + c); } catch (e: any) { if (e?.type !== "unavailable-id") throw e; } }
      if (!p) throw new Error("Could not get a free code. Please try again.");
      peerRef.current = p; setCode(c); setQr(await QRCode.toDataURL(`${location.origin}/send-files?code=${c}`, { margin: 1, width: 200 }));
      let n = 0;
      p.on("connection", (conn: any) => {
        const id = ++n; conns.current.set(id, conn); setXfers((l) => [...l, { id, status: "asking", sent: 0, total: 0 }]);
        conn.on("close", () => setXfers((l) => l.map((x) => (x.id === id && (x.status === "asking" || x.status === "sending") ? { ...x, status: "lost" } : x))));
      });
      p.on("disconnected", () => { try { p.reconnect(); } catch { /* ignore */ } });
      p.on("error", () => setError("The connection was interrupted. Stop sharing and start again."));
      try { wake.current = await (navigator as any).wakeLock?.request("screen"); } catch { /* optional */ }
    } catch (e: any) { setError(e?.type === "network" || e?.type === "server-error" || e?.type === "socket-error" ? "Could not reach the connection service. Check your internet and try again." : e?.message || "Could not start sharing."); }
  };
  const decide = async (id: number, ok: boolean) => {
    const conn = conns.current.get(id); if (!conn) return;
    if (!ok) { upd(id, { status: "declined" }); conn.close(); return; }
    if (!conn.open) await new Promise((r) => conn.once("open", r));
    sendAll(id);
  };
  const stopSharing = () => { stopAll(); setCode(""); setQr(""); setXfers([]); };

  // ================= receive =================
  const receive = useCallback(async (raw: string) => {
    const c = raw.replace(/\D/g, ""); if (c.length !== 6) { setError("The code has 6 digits."); return; }
    setError(""); setRx([]); setPhase("connecting"); rxPeer.current?.destroy();
    let finished = false;
    try {
      const p = await openPeer(); rxPeer.current = p;
      const timer = setTimeout(() => { if (!finished) { setError("Could not connect. Both devices need internet, and some networks block direct connections. Try mobile data on one device."); setPhase("idle"); p.destroy(); } }, 25000);
      p.on("error", (e: any) => { clearTimeout(timer); setPhase("idle"); setError(e?.type === "peer-unavailable" ? "No one is sharing with that code. Check the digits, and make sure the sender's page is still open." : "Connection problem. Please try again."); });
      const conn = p.connect(PREFIX + c, { reliable: true });
      let list: Got[] = [], cur: { i: number; chunks: BlobPart[] } | null = null;
      const push = () => setRx(list.map((x) => ({ ...x })));
      conn.on("open", () => { clearTimeout(timer); setPhase("waiting"); });
      conn.on("data", (d: any) => {
        if (d && typeof d === "object" && !(d instanceof ArrayBuffer) && !ArrayBuffer.isView(d) && d.t) {
          if (d.t === "meta") { list = d.files.map((f: any) => ({ ...f, got: 0 })); setPhase("receiving"); push(); }
          else if (d.t === "start") cur = { i: d.i, chunks: [] };
          else if (d.t === "end" && cur) { list[cur.i].blob = new Blob(cur.chunks, { type: list[cur.i].type }); list[cur.i].got = list[cur.i].size; cur = null; push(); }
          else if (d.t === "done") { finished = true; setPhase("done"); }
        } else if (cur) {
          const u8: Uint8Array = d instanceof ArrayBuffer ? new Uint8Array(d) : new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
          cur.chunks.push(u8 as BlobPart); list[cur.i].got += u8.byteLength; push();
        }
      });
      conn.on("close", () => { clearTimeout(timer); if (!finished) { setPhase("idle"); setError(list.length ? "The connection ended before everything arrived. Ask the sender to share again." : "The sender did not accept, or closed the page."); } });
    } catch { setPhase("idle"); setError("Could not reach the connection service. Check your internet and try again."); }
  }, []);

  useEffect(() => { const c = new URLSearchParams(location.search).get("code"); if (c && /^\d{6}$/.test(c)) { setMode("receive"); setCodeIn(c); receive(c); } }, [receive]);

  const pickBox = useRef<HTMLLabelElement>(null);
  usePasteTarget(pickBox, (f) => setFiles((x) => [...x, ...f]));
  const pick = (list: FileList | null) => { if (list) setFiles((f) => [...f, ...Array.from(list)]); };
  const total = files.reduce((n, f) => n + f.size, 0);
  const tab = (m: "send" | "receive", l: string) => <button role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }} className={`chip ${mode === m ? "chip-active" : ""}`}>{l}</button>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">{tab("send", "Send files")}{tab("receive", "Receive files")}</div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="sf-error">{error}</p>}

      {mode === "send" && !code && (
        <div className="space-y-3">
          <label ref={pickBox} className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-6 text-center">
            <span className="font-semibold">Tap to choose files</span><span className="text-sm text-neutral-500">any type, as many as you like<span className="hidden sm:inline">, or paste with Ctrl+V</span></span>
            <span className="mt-3"><PasteButton small label="Paste a copied image" onFiles={(f) => setFiles((x) => [...x, ...f])} /></span>
            <input data-testid="sf-pick" type="file" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
          </label>
          {files.length > 0 && (
            <div className="rounded-xl border bg-white p-3 text-sm">
              <ul className="divide-y">{files.map((f, i) => <li key={i} className="flex items-center justify-between gap-2 py-1.5"><span className="truncate">{f.name}</span><span className="shrink-0 text-neutral-500">{formatBytes(f.size)} <button className="ml-2 text-red-600" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button></span></li>)}</ul>
              <p className="mt-2 text-neutral-500">{files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(total)}{total > 500 * 1024 * 1024 ? " · Big transfers can run out of memory on phones. Send large files in parts." : ""}</p>
            </div>
          )}
          <button className="btn w-full" disabled={!files.length} onClick={startSharing} data-testid="sf-start">Get a code</button>
        </div>
      )}

      {mode === "send" && code && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="text-sm text-neutral-500">Tell the other person to open this tool, tap Receive files and enter</p>
            <p className="my-2 font-mono text-5xl font-bold tracking-widest" data-testid="sf-code">{fmtCode(code)}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(code).then(() => setNote("Code copied.")).catch(() => {}); setTimeout(() => setNote(""), 2000); }}>Copy code</button>
              <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/send-files?code=${code}`).then(() => setNote("Link copied.")).catch(() => {}); setTimeout(() => setNote(""), 2000); }}>Copy link</button>
            </div>
            {note && <p className="mt-1 text-sm text-green-700">{note}</p>}
            {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="QR code to receive the files" className="mx-auto mt-3 h-32 w-32 rounded border" />}
            <p className="mt-3 text-xs text-neutral-500">Keep this page open until the files arrive. {files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(total)}</p>
          </div>
          {xfers.map((x) => (
            <div key={x.id} className="rounded-xl border bg-white p-3 text-sm" data-testid="sf-xfer" data-status={x.status}>
              {x.status === "asking" && (<div className="space-y-2"><p><b>Someone entered your code</b> and wants the files. Do you know them?</p><div className="flex gap-2"><button className="btn" onClick={() => decide(x.id, true)} data-testid="sf-allow">Allow and send</button><button className="btn-ghost" onClick={() => decide(x.id, false)}>Decline</button></div></div>)}
              {x.status === "sending" && (<div><p>Sending… {pct(x.sent, x.total)}%</p><div className="mt-1 h-2 rounded bg-neutral-200"><div className="h-2 rounded bg-neutral-900" style={{ width: `${pct(x.sent, x.total)}%` }} /></div></div>)}
              {x.status === "done" && <p className="text-green-700">Sent. The other person has everything.</p>}
              {x.status === "declined" && <p className="text-neutral-500">Declined.</p>}
              {x.status === "lost" && <p className="text-red-700">The other device disconnected before it finished.</p>}
            </div>
          ))}
          <button className="btn-ghost w-full" onClick={stopSharing}>Stop sharing</button>
        </div>
      )}

      {mode === "receive" && (
        <div className="space-y-3">
          {phase === "idle" && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); receive(codeIn); }}>
              <input aria-label="6-digit code" data-testid="sf-codein" inputMode="numeric" className="input font-mono text-2xl tracking-widest" maxLength={7} value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="000 000" autoComplete="off" />
              <button className="btn" disabled={codeIn.replace(/\D/g, "").length !== 6} data-testid="sf-go">Connect</button>
            </form>
          )}
          {phase === "connecting" && <p className="text-sm text-neutral-600">Connecting…</p>}
          {phase === "waiting" && <p className="rounded-xl border bg-white p-3 text-sm" data-testid="sf-waiting">Connected. Waiting for the sender to allow it…</p>}
          {(phase === "receiving" || phase === "done") && (
            <div className="space-y-2" data-testid="sf-rx">
              {rx.map((f, i) => (
                <div key={i} className="rounded-xl border bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{f.name}</span><span className="shrink-0 text-neutral-500">{formatBytes(f.size)}</span></div>
                  {f.blob ? <button className="btn mt-2 w-full" onClick={() => download(f.blob!, f.name, f.type || "application/octet-stream")}>Download</button>
                    : <div className="mt-2 h-2 rounded bg-neutral-200"><div className="h-2 rounded bg-neutral-900" style={{ width: `${pct(f.got, f.size)}%` }} /></div>}
                </div>
              ))}
              {phase === "done" && rx.length > 1 && <button className="btn w-full" onClick={async () => { for (const f of rx) if (f.blob) { download(f.blob, f.name, f.type || "application/octet-stream"); await sleep(400); } }}>Download all</button>}
              {phase === "done" && <p className="text-sm text-green-700" data-testid="sf-done">All files received.</p>}
            </div>
          )}
          {phase !== "idle" && <button className="btn-ghost w-full" onClick={() => { rxPeer.current?.destroy(); setPhase("idle"); setRx([]); }}>{phase === "done" ? "Receive more" : "Cancel"}</button>}
        </div>
      )}

      <p className="text-xs text-neutral-500">Files go directly from one device to the other and are never stored on our servers. Both devices need an internet connection (Wi-Fi or mobile data) and the sender must keep the page open. You approve every person who enters your code.</p>
    </div>
  );
}
