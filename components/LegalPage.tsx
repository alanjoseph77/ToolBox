import type { ReactNode } from "react";

export default function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {updated && <p className="mt-1 text-sm text-neutral-500">Last updated: {updated}</p>}
      <div className="mt-8 space-y-4 leading-relaxed text-neutral-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1 dark:[&_h2]:text-white">
        {children}
      </div>
    </article>
  );
}
