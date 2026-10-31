import { useState } from 'react';
import { Lightbox } from '../../components/Lightbox';

type Item = { id?: string; url?: string; name?: string; chosen?: boolean };

/** Approved work grid; any image opens a lightbox that moves through all of them. */
export function ApprovedWork({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const valid = items.filter((i) => typeof i.url === 'string' && i.url.startsWith('http'));
  const list = (valid.some((i) => i.chosen) ? valid.filter((i) => i.chosen) : valid).slice(0, 8);
  if (!list.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {list.map((i, k) => (
          <button key={i.id ?? i.url} type="button" className="tile text-left" style={{ cursor: 'zoom-in' }} onClick={() => setOpen(k)}>
            <div className="thumb thumb-work" style={{ overflow: 'hidden' }}>
              <img className="cover h-full w-full object-cover" src={i.url} alt={i.name ?? ''} loading="lazy" />
            </div>
            {i.name && <div className="tile-meta"><span className="tile-name">{i.name}</span></div>}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox items={list.map((i) => ({ url: i.url!, name: i.name }))} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
