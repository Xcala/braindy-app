export function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <section>
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 text-black/55">Coming in phase {phase}.</p>
    </section>
  );
}
