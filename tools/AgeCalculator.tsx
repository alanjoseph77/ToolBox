"use client";
import { useMemo, useState } from "react";
import Stat from "@/components/Stat";
import { age } from "@/lib/age";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [on, setOn] = useState(today);
  const res = useMemo(() => { if (!dob) return { r: null, error: "" }; try { return { r: age(dob, on), error: "" }; } catch (e) { return { r: null, error: (e as Error).message }; } }, [dob, on]);
  const r = res.r;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="dob">Date of birth</label><input id="dob" type="date" className="input" value={dob} max={on} onChange={(e) => setDob(e.target.value)} /></div>
        <div><label className="label" htmlFor="on">Age on</label><input id="on" type="date" className="input" value={on} onChange={(e) => setOn(e.target.value)} /></div>
      </div>
      {res.error && <p className="text-sm text-red-600">{res.error}</p>}
      {r && <>
        <div className="rounded-xl border bg-white p-6 text-center"><p className="text-3xl font-extrabold" data-age="1">{r.years} years, {r.months} months, {r.days} days</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Total months" value={r.totalMonths.toLocaleString("en-IN")} id="months" /><Stat label="Total days" value={r.totalDays.toLocaleString("en-IN")} id="days" /><Stat label="Next birthday in" value={`${r.nextBirthdayInDays} days`} id="next" /></div>
        <p className="text-sm text-neutral-600">Your next birthday falls on a {r.nextBirthdayWeekday}.</p>
      </>}
    </div>
  );
}
