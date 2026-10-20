type Font = { id?: string; name?: string; fontFamily?: string; role?: string; description?: string; downloadUrl?: string; url?: string };

export function Typography({ fonts }: { fonts: Font[] }) {
  if (!fonts.length) return null;
  return (
    <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
      {fonts.map((f) => {
        const link = f.downloadUrl || f.url;
        return (
          <li key={f.id ?? f.name} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-4">
            <div>
              <div className="text-2xl" style={{ fontFamily: f.fontFamily }}>{f.name ?? f.fontFamily}</div>
              {f.description && <p className="mt-1 max-w-xl text-sm text-black/60">{f.description}</p>}
            </div>
            <div className="flex items-center gap-3 text-sm text-black/60">
              {f.role && <span className="rounded-full border border-black/15 px-2 py-0.5">{f.role}</span>}
              {link && <a href={link} target="_blank" rel="noreferrer" className="hover:text-ink">↗</a>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
