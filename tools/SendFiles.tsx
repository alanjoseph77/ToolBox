"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Users, X } from "lucide-react";
import QRCode from "qrcode";
import { download, formatBytes } from "@/lib/files";
import PasteButton, { usePasteTarget } from "@/components/PasteButton";

// Files travel straight from one device to the other (WebRTC). A small "matchmaker" service only introduces the two
// devices using the code; it never sees the files. Set NEXT_PUBLIC_PEER_* to use your own matchmaker, NEXT_PUBLIC_TURN_* for a relay.
const PREFIX = "toolbox-";
const CHUNK = 64 * 1024;
const PARALLEL = 3;          // workshop mode: how many people receive at the same time; the rest wait in line

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

interface Xfer { id: number; name: string; status: "asking" | "queued" | "sending" | "done" | "declined" | "lost"; sent: number; total: number }
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
  const [workshop, setWorkshop] = useState(false);
  const [projector, setProjector] = useState(false);
  const [bigQr, setBigQr] = useState("");
  const queue = useRef<number[]>([]);          // workshop: people waiting for a free slot, in arrival order
  const active = useRef(0);
  const workshopRef = useRef(false);
  const peerRef = useRef<any>(null);
  const conns = useRef<Map<number, any>>(new Map());
  const filesRef = useRef<File[]>([]);
  const wake = useRef<any>(null);
  // ---- receive ----
  const [codeIn, setCodeIn] = useState("");
  const [phase, setPhase] = useState<"idle" | "connecting" | "waiting" | "receiving" | "done">("idle");
  const [rx, setRx] = useState<Got[]>([]);
  const [myName, setMyName] = useState("");
  const nameRef = useRef("");
  nameRef.current = myName;
  const [linePos, setLinePos] = useState(0);
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

  // Workshop mode: keep up to PARALLEL transfers running; tell everyone still waiting their place in line.
  const tellLine = () => queue.current.forEach((id, i) => { const c = conns.current.get(id); if (c?.open) try { c.send({ t: "queue", pos: i + 1 }); } catch { /* gone */ } });
  const pump = () => {
    while (active.current < PARALLEL && queue.current.length) {
      const id = queue.current.shift()!, conn = conns.current.get(id);
      if (!conn) continue;
      active.current++;
      (async () => { if (!conn.open) await new Promise((r) => conn.once("open", r)); await sendAll(id); })()
        .finally(() => { active.current--; pump(); });
    }
    tellLine();
  };

  const startSharing = async () => {
    setError(""); filesRef.current = files; workshopRef.current = workshop; queue.current = []; active.current = 0;
    try {
      let p: any = null, c = "";
      for (let i = 0; i < 6 && !p; i++) { c = makeCode(); try { p = await openPeer(PREFIX + c); } catch (e: any) { if (e?.type !== "unavailable-id") throw e; } }
      if (!p) throw new Error("Could not get a free code. Please try again.");
      peerRef.current = p; setCode(c);
      const link = `${location.origin}/send-files?code=${c}`;
      setQr(await QRCode.toDataURL(link, { margin: 1, width: 200 })); setBigQr(await QRCode.toDataURL(link, { margin: 1, width: 640 }));
      let n = 0;
      p.on("connection", (conn: any) => {
        const id = ++n, name = String(conn.metadata?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 30);
        conns.current.set(id, conn);
        setXfers((l) => [...l, { id, name, status: workshopRef.current ? "queued" : "asking", sent: 0, total: 0 }]);
        conn.on("close", () => { queue.current = queue.current.filter((q) => q !== id); setXfers((l) => l.map((x) => (x.id === id && (x.status === "asking" || x.status === "queued" || x.status === "sending") ? { ...x, status: "lost" } : x))); tellLine(); });
        if (workshopRef.current) { queue.current.push(id); if (conn.open) pump(); else conn.once("open", pump); }
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
  const stopSharing = () => {
    if (xfers.some((x) => x.status === "sending" || x.status === "queued") && !window.confirm("Some people are still receiving or waiting. Stop sharing anyway?")) return;
    stopAll(); setCode(""); setQr(""); setBigQr(""); setXfers([]); setProjector(false); queue.current = []; active.current = 0;
  };

  // ================= receive =================
  const receive = useCallback(async (raw: string) => {
    const c = raw.replace(/\D/g, ""); if (c.length !== 6) { setError("The code has 6 digits."); return; }
    setError(""); setRx([]); setPhase("connecting"); rxPeer.current?.destroy();
    let finished = false;
    try {
      const p = await openPeer(); rxPeer.current = p;
      const timer = setTimeout(() => { if (!finished) { setError("Could not connect. Both devices need internet, and some networks block direct connections. Try mobile data on one device."); setPhase("idle"); p.destroy(); } }, 25000);
      p.on("error", (e: any) => { clearTimeout(timer); setPhase("idle"); setError(e?.type === "peer-unavailable" ? "No one is sharing with that code. Check the digits, and make sure the sender's page is still open." : "Connection problem. Please try again."); });
      const conn = p.connect(PREFIX + c, { reliable: true, metadata: { name: nameRef.current.trim().slice(0, 30) } });
      setLinePos(0);
      let list: Got[] = [], cur: { i: number; chunks: BlobPart[] } | null = null;
      const push = () => setRx(list.map((x) => ({ ...x })));
      conn.on("open", () => { clearTimeout(timer); setPhase("waiting"); });
      conn.on("data", (d: any) => {
        if (d && typeof d === "object" && !(d instanceof ArrayBuffer) && !ArrayBuffer.isView(d) && d.t) {
          if (d.t === "queue") setLinePos(Number(d.pos) || 0);
          else if (d.t === "meta") { setLinePos(0); list = d.files.map((f: any) => ({ ...f, got: 0 })); setPhase("receiving"); push(); }
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

  const pickBox = useRef<HTMLDivElement>(null), pickInput = useRef<HTMLInputElement>(null);
  usePasteTarget(pickBox, (f) => setFiles((x) => [...x, ...f]));
  const pick = (list: FileList | null) => { if (list) setFiles((f) => [...f, ...Array.from(list)]); };
  const total = files.reduce((n, f) => n + f.size, 0);
  const tally = { done: xfers.filter((x) => x.status === "done").length, sending: xfers.filter((x) => x.status === "sending").length, queued: xfers.filter((x) => x.status === "queued").length, lost: xfers.filter((x) => x.status === "lost").length };
  const tab = (m: "send" | "receive", l: string) => <button role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }} className={`chip ${mode === m ? "chip-active" : ""}`}>{l}</button>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">{tab("send", "Send files")}{tab("receive", "Receive files")}</div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="sf-error">{error}</p>}

      {mode === "send" && !code && (
        <div className="space-y-3">
          <div ref={pickBox} role="button" tabIndex={0} aria-label="Choose files to send" data-testid="sf-box" onClick={() => pickInput.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickInput.current?.click(); } }}
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-6 text-center">
            <span className="font-semibold">Tap to choose files</span><span className="text-sm text-neutral-500">any type, as many as you like<span className="hidden sm:inline">, or paste with Ctrl+V</span></span>
            <span className="mt-3"><PasteButton small label="Paste a copied image" onFiles={(f) => setFiles((x) => [...x, ...f])} /></span>
            <input ref={pickInput} data-testid="sf-pick" type="file" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
          </div>
          {files.length > 0 && (
            <div className="rounded-xl border bg-white p-3 text-sm">
              <ul className="divide-y">{files.map((f, i) => <li key={i} className="flex items-center justify-between gap-2 py-1.5"><span className="truncate">{f.name}</span><span className="shrink-0 text-neutral-500">{formatBytes(f.size)} <button className="ml-2 text-red-600" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button></span></li>)}</ul>
              <p className="mt-2 text-neutral-500">{files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(total)}{total > 500 * 1024 * 1024 ? " · Big transfers can run out of memory on phones. Send large files in parts." : ""}</p>
            </div>
          )}
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5" checked={workshop} onChange={(e) => setWorkshop(e.target.checked)} data-testid="sf-workshop" />
            <span><span className="flex items-center gap-1.5 font-semibold"><Users className="h-4 w-4" aria-hidden /> Workshop mode (many people)</span>
              <span className="block text-neutral-500">For a class, workshop or meeting: everyone with the code gets the files without you tapping Allow. {PARALLEL} people receive at a time; the rest wait in line.</span>
              {workshop && files.length > 0 && <span className="mt-1 block text-neutral-500">For 15 people this sends {formatBytes(total * 15)} from this device in total.{total > 50 * 1024 * 1024 ? " That is a lot: a Google Drive link as a QR code may be faster." : ""}</span>}</span>
          </label>
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
          {workshop && (
            <div className="space-y-3 rounded-xl border bg-white p-4" data-testid="sf-summary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold"><span data-testid="sf-count">{tally.done}</span> received</p>
                <button className="btn-ghost !py-1.5 text-sm" onClick={() => { setProjector(true); document.documentElement.requestFullscreen?.().catch(() => {}); }} data-testid="sf-projector-btn"><Maximize2 className="h-4 w-4" /> Show on projector</button>
              </div>
              <p className="text-sm text-neutral-500">{tally.sending} receiving now · {tally.queued} waiting in line{tally.lost ? ` · ${tally.lost} disconnected` : ""}</p>
            </div>
          )}
          {xfers.map((x) => workshop ? (
            <div key={x.id} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm" data-testid="sf-xfer" data-status={x.status}>
              <span className="w-28 shrink-0 truncate font-medium">{x.name || `Person ${x.id}`}</span>
              <span className="min-w-0 flex-1">
                {x.status === "sending" ? <span className="block h-2 rounded bg-neutral-200"><span className="block h-2 rounded bg-neutral-900" style={{ width: `${pct(x.sent, x.total)}%` }} /></span>
                  : <span className={x.status === "done" ? "text-green-700" : x.status === "lost" ? "text-red-700" : "text-neutral-500"}>{x.status === "done" ? "✓ Received" : x.status === "queued" ? `Waiting in line (#${xfers.filter((y) => y.status === "queued").findIndex((y) => y.id === x.id) + 1})` : x.status === "lost" ? "Disconnected" : ""}</span>}
              </span>
              {x.status === "sending" && <span className="w-10 shrink-0 text-right text-xs text-neutral-500">{pct(x.sent, x.total)}%</span>}
            </div>
          ) : (
            <div key={x.id} className="rounded-xl border bg-white p-3 text-sm" data-testid="sf-xfer" data-status={x.status}>
              {x.status === "asking" && (<div className="space-y-2"><p><b>{x.name ? `${x.name}` : "Someone"} entered your code</b> and wants the files. Do you know them?</p><div className="flex gap-2"><button className="btn" onClick={() => decide(x.id, true)} data-testid="sf-allow">Allow and send</button><button className="btn-ghost" onClick={() => decide(x.id, false)}>Decline</button></div></div>)}
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
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); receive(codeIn); }}>
              <div className="flex gap-2">
              <input aria-label="6-digit code" data-testid="sf-codein" inputMode="numeric" className="input font-mono text-2xl tracking-widest" maxLength={7} value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="000 000" autoComplete="off" />
              <button className="btn" disabled={codeIn.replace(/\D/g, "").length !== 6} data-testid="sf-go">Connect</button>
              </div>
              <input aria-label="Your name (optional)" data-testid="sf-name" className="input" maxLength={30} value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Your name (optional), so the sender knows it is you" autoComplete="name" />
            </form>
          )}
          {phase === "connecting" && <p className="text-sm text-neutral-600">Connecting…</p>}
          {phase === "waiting" && <p className="rounded-xl border bg-white p-3 text-sm" data-testid="sf-waiting">{linePos ? <>Connected. You are <b>number {linePos}</b> in line. Your files start soon; keep this page open.</> : "Connected. Waiting for the sender…"}</p>}
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

      {projector && code && createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 overflow-auto bg-white p-6 text-center dark:bg-black" role="dialog" aria-modal="true" aria-label="Code for the projector" data-testid="sf-projector">
          <button className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border" onClick={() => { setProjector(false); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }} aria-label="Close projector view"><X className="h-5 w-5" /></button>
          <p className="text-xl font-semibold text-neutral-600 sm:text-3xl dark:text-neutral-300">Open <b className="text-neutral-900 dark:text-white">{typeof window !== "undefined" ? window.location.host : "toolbox.otaga.in"}/send-files</b>, tap <b className="text-neutral-900 dark:text-white">Receive files</b> and enter</p>
          <p className="whitespace-nowrap font-mono text-6xl font-black tracking-[0.1em] sm:text-[9rem] sm:tracking-[0.15em]">{fmtCode(code)}</p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {bigQr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={bigQr} alt="Scan to receive the files" className="h-56 w-56 rounded-2xl border bg-white p-2 sm:h-72 sm:w-72" />}
            <div className="text-left"><p className="text-xl text-neutral-500">or scan with your phone camera</p>
              <p className="mt-4 text-5xl font-black sm:text-6xl" data-testid="sf-projector-count">{tally.done} <span className="text-2xl font-semibold text-neutral-500 sm:text-3xl">received</span></p>
              <p className="mt-1 text-lg text-neutral-500">{tally.sending} receiving · {tally.queued} waiting</p></div>
          </div>
          <p className="text-sm text-neutral-500">{files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(total)} · keep this page open</p>
        </div>, document.body
      )}

      <p className="text-xs text-neutral-500">Files go directly from one device to the other and are never stored on our servers. Both devices need an internet connection (Wi-Fi or mobile data) and the sender must keep the page open. You approve every person who enters your code, unless you switch on Workshop mode.</p>
    </div>
  );
}
