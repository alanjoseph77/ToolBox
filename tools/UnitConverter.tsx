"use client";
import { useState } from "react";

// Each unit has a factor to the category's base unit (temperature is handled separately).
const units: Record<string, Record<string, number>> = {
  Length: { Metre: 1, Kilometre: 1000, Centimetre: 0.01, Millimetre: 0.001, Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  Weight: { Kilogram: 1, Gram: 0.001, Milligram: 1e-6, Tonne: 1000, Pound: 0.45359237, Ounce: 0.028349523125, Quintal: 100 },
  Area: { "Sq metre": 1, "Sq km": 1e6, "Sq foot": 0.09290304, "Sq yard": 0.83612736, Acre: 4046.8564224, Hectare: 10000, "Sq inch": 0.00064516 },
  Volume: { Litre: 1, Millilitre: 0.001, "Cubic metre": 1000, Gallon: 3.785411784, Quart: 0.946352946, Cup: 0.2365882365, "Fluid ounce": 0.0295735295625 },
  Speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, Knot: 0.514444 },
  Data: { Byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
};

const toC = (v: number, u: string) => (u === "Fahrenheit" ? ((v - 32) * 5) / 9 : u === "Kelvin" ? v - 273.15 : v);
const fromC = (v: number, u: string) => (u === "Fahrenheit" ? (v * 9) / 5 + 32 : u === "Kelvin" ? v + 273.15 : v);

export default function UnitConverter() {
  const [cat, setCat] = useState("Length");
  const names = Object.keys(units[cat]);
  const [from, setFrom] = useState(names[0]);
  const [to, setTo] = useState(names[1]);
  const [value, setValue] = useState("1");

  const changeCat = (c: string) => { const n = Object.keys(units[c]); setCat(c); setFrom(n[0]); setTo(n[1]); };
  const v = parseFloat(value);
  const result = isNaN(v) ? "" : cat === "Temperature" ? fromC(toC(v, from), to) : (v * units[cat][from]) / units[cat][to];
  const shown = result === "" ? "" : Number(result.toPrecision(10)).toString();

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(units).map((c) => <button key={c} className={c === cat ? "btn !py-1.5" : "btn-ghost !py-1.5"} onClick={() => changeCat(c)}>{c}</button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><label className="label">From</label>
          <input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div className="space-y-2"><label className="label">To</label>
          <input className="input bg-neutral-50 font-semibold" readOnly value={shown} />
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</select></div>
      </div>
    </div>
  );
}
