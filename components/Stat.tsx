/** A labelled result figure used by the calculators. */
export default function Stat({ label, value, big = false, id }: { label: string; value: string; big?: boolean; id?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 text-center" data-stat={id ?? label}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 font-extrabold tabular-nums ${big ? "text-3xl" : "text-xl"}`}>{value}</p>
    </div>
  );
}
