import type { Block } from "./textPdf";

const strip = (s: string) => s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)").replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2").replace(/`([^`]+)`/g, "$1");

/** A simple Markdown reader: headings, paragraphs, bullet and numbered lists, quotes and code blocks. */
export function mdToBlocks(md: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [], code = false;
  const flush = () => { if (para.length) out.push({ text: strip(para.join(" ")), style: "p" }); para = []; };
  for (const raw of md.replace(/\r\n?/g, "\n").split("\n")) {
    if (/^\s*```/.test(raw)) { flush(); code = !code; continue; }
    if (code) { out.push({ text: raw.replace(/\t/g, "    ") || " ", style: "p" }); continue; }
    const line = raw.trimEnd();
    const h = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (h) { flush(); out.push({ text: strip(h[2]), style: h[1].length === 1 ? "h1" : h[1].length === 2 ? "h2" : "h3" }); continue; }
    const li = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) { flush(); out.push({ text: strip(li[1]), style: "li" }); continue; }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flush(); continue; }
    if (!line.trim()) { flush(); continue; }
    para.push(line.replace(/^>\s?/, "").trim());
  }
  flush();
  return out;
}
