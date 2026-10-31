/** Renders the HTML in a hidden, sandboxed frame so its styles can't touch this page, then serialises it for SVG. */
async function snapshot(html: string, width: number): Promise<{ markup: string; height: number }> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  Object.assign(frame.style, { position: "fixed", left: "-99999px", top: "0", width: `${width}px`, height: "10px", border: "0" });
  document.body.appendChild(frame);
  try {
    await new Promise<void>((res) => { frame.onload = () => res(); frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`; });
    const d = frame.contentDocument!;
    const height = Math.max(20, Math.ceil(d.documentElement.scrollHeight));
    const xs = new XMLSerializer();
    d.querySelectorAll("script").forEach((s) => s.remove());
    const styles = [...d.querySelectorAll("style")].map((s) => xs.serializeToString(s)).join("");
    const body = xs.serializeToString(d.body);
    return { markup: `${styles}${body}`, height };
  } finally { frame.remove(); }
}


/** Draws pasted HTML onto a canvas of the given width. Scripts are ignored and nothing from other sites is loaded. */
export async function htmlToCanvas(html: string, width: number, scale: number, bg: string): Promise<HTMLCanvasElement> {
  const { markup, height } = await snapshot(html, width);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px">${markup}</div></foreignObject></svg>`;
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("render")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
  const c = document.createElement("canvas"); c.width = width * scale; c.height = height * scale;
  const g = c.getContext("2d")!; g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
