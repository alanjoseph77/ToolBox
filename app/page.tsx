import ToolSearch from "@/components/ToolSearch";
import ToolCard from "@/components/ToolCard";
import { categories, tools } from "@/lib/tools";

const titles = { PDF: "PDF tools", Image: "Image tools", Developer: "Developer utilities", Utility: "Utility tools" } as const;

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="py-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">ToolBox – all your tools in one place</h1>
        <p className="mx-auto mt-3 mb-8 max-w-xl text-slate-600">Private, mobile-friendly tools that run on your device. No signup, no uploads.</p>
        <ToolSearch />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Popular tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.filter((t) => t.popular).map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>
      {categories.map((c) => (
        <section key={c}>
          <h2 className="mb-3 text-xl font-bold">{titles[c]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.filter((t) => t.category === c).map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
