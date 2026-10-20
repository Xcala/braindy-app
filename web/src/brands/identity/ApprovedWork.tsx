type Item = { id?: string; url?: string; name?: string; chosen?: boolean };

export function ApprovedWork({ items }: { items: Item[] }) {
  const valid = items.filter((i) => typeof i.url === 'string' && i.url.startsWith('http'));
  const list = (valid.some((i) => i.chosen) ? valid.filter((i) => i.chosen) : valid).slice(0, 8);
  if (!list.length) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((i) => (
        <a key={i.id ?? i.url} className="tile" href={i.url} target="_blank" rel="noreferrer">
          <div className="thumb" style={{ height: 240, overflow: 'hidden' }}>
            <img className="cover h-full w-full object-cover" src={i.url} alt="" loading="lazy" />
          </div>
          {i.name && <div className="tile-meta"><span className="tile-name">{i.name}</span></div>}
        </a>
      ))}
    </div>
  );
}
