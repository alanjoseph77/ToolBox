"use client";
import { useState } from "react";
import AiNotice from "@/components/AiNotice";
import { callAi } from "@/lib/ai";
import { download } from "@/lib/files";
import { Block, blocksToPdf } from "@/lib/textPdf";

interface Job { role: string; company: string; dates: string; bullets: string }
interface Edu { degree: string; school: string; year: string }
interface Resume { name: string; title: string; email: string; phone: string; location: string; summary: string; experience: Job[]; education: Edu[]; skills: string }

const empty: Resume = {
  name: "", title: "", email: "", phone: "", location: "", summary: "", skills: "",
  experience: [{ role: "", company: "", dates: "", bullets: "" }], education: [{ degree: "", school: "", year: "" }],
};

export default function ResumeBuilder() {
  const [r, setR] = useState<Resume>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Resume>(k: K, v: Resume[K]) => setR({ ...r, [k]: v });
  const upd = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((x, k) => (k === i ? { ...x, ...patch } : x));

  const polish = async () => {
    setBusy(true); setError("");
    try { setR(await callAi<Resume>({ action: "resume", resume: r })); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const save = async () => {
    const b: Block[] = [{ text: r.name || "Your Name", style: "h1" }];
    if (r.title) b.push({ text: r.title, style: "p", bold: true });
    const contact = [r.email, r.phone, r.location].filter(Boolean).join("  |  ");
    if (contact) b.push({ text: contact, style: "p" });
    if (r.summary) b.push({ text: "SUMMARY", style: "h3" }, { text: r.summary, style: "p" });
    const jobs = r.experience.filter((j) => j.role || j.company);
    if (jobs.length) {
      b.push({ text: "EXPERIENCE", style: "h3" });
      for (const j of jobs) {
        b.push({ text: [j.role, j.company].filter(Boolean).join(", ") + (j.dates ? `  (${j.dates})` : ""), style: "p", bold: true });
        j.bullets.split("\n").map((x) => x.trim()).filter(Boolean).forEach((t) => b.push({ text: t.replace(/^[-*•]\s*/, ""), style: "li" }));
      }
    }
    const edu = r.education.filter((e) => e.degree || e.school);
    if (edu.length) { b.push({ text: "EDUCATION", style: "h3" }); edu.forEach((e) => b.push({ text: [e.degree, e.school].filter(Boolean).join(", ") + (e.year ? `  (${e.year})` : ""), style: "p" })); }
    if (r.skills.trim()) b.push({ text: "SKILLS", style: "h3" }, { text: r.skills, style: "p" });
    download(await blocksToPdf(b), `${(r.name || "resume").replace(/\s+/g, "-").toLowerCase()}-resume.pdf`, "application/pdf");
  };

  const Field = ({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) => (
    <div><label className="label">{label}</label>{area ? <textarea className="input h-24" value={value} onChange={(e) => onChange(e.target.value)} /> : <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />}</div>
  );

  return (
    <div className="space-y-4">
      <AiNotice />
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <Field label="Full name" value={r.name} onChange={(v) => set("name", v)} />
        <Field label="Job title" value={r.title} onChange={(v) => set("title", v)} />
        <Field label="Email" value={r.email} onChange={(v) => set("email", v)} />
        <Field label="Phone" value={r.phone} onChange={(v) => set("phone", v)} />
        <div className="sm:col-span-2"><Field label="Location" value={r.location} onChange={(v) => set("location", v)} /></div>
        <div className="sm:col-span-2"><Field area label="Summary" value={r.summary} onChange={(v) => set("summary", v)} /></div>
      </div>
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Experience</h2>
        {r.experience.map((j, i) => (
          <div key={i} className="grid gap-3 border-b pb-3 sm:grid-cols-3">
            <Field label="Role" value={j.role} onChange={(v) => set("experience", upd(r.experience, i, { role: v }))} />
            <Field label="Company" value={j.company} onChange={(v) => set("experience", upd(r.experience, i, { company: v }))} />
            <Field label="Dates" value={j.dates} onChange={(v) => set("experience", upd(r.experience, i, { dates: v }))} />
            <div className="sm:col-span-3"><Field area label="Achievements (one per line)" value={j.bullets} onChange={(v) => set("experience", upd(r.experience, i, { bullets: v }))} /></div>
          </div>
        ))}
        <button className="btn-ghost !py-1.5" onClick={() => set("experience", [...r.experience, { role: "", company: "", dates: "", bullets: "" }])}>+ Add job</button>
      </div>
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Education</h2>
        {r.education.map((e, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-3">
            <Field label="Degree" value={e.degree} onChange={(v) => set("education", upd(r.education, i, { degree: v }))} />
            <Field label="School" value={e.school} onChange={(v) => set("education", upd(r.education, i, { school: v }))} />
            <Field label="Year" value={e.year} onChange={(v) => set("education", upd(r.education, i, { year: v }))} />
          </div>
        ))}
        <button className="btn-ghost !py-1.5" onClick={() => set("education", [...r.education, { degree: "", school: "", year: "" }])}>+ Add education</button>
      </div>
      <div className="rounded-xl border bg-white p-4"><Field area label="Skills (comma separated)" value={r.skills} onChange={(v) => set("skills", v)} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="btn-ghost" disabled={busy || !r.summary && !r.experience[0].bullets} onClick={polish}>{busy ? "Polishing…" : "✨ Polish wording with AI"}</button>
        <button className="btn" onClick={save}>Download PDF</button>
      </div>
      <p className="text-xs text-slate-500">The PDF is a clean single-column, ATS-friendly layout. Review AI edits before sending your resume. Latin characters only for now.</p>
    </div>
  );
}
