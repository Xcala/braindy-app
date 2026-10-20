import type { ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-black/50">{title}</h2>
      {children}
    </section>
  );
}
