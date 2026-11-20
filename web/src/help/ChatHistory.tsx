import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';

type Row = { id: string; title: string; at: number };
const DAY = 86_400_000;
const GROUPS = ['help.histToday', 'help.histYesterday', 'help.histWeek', 'help.histMonth', 'help.histOlder'] as const;
const groupOf = (at: number) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return at >= t0 ? 0 : at >= t0 - DAY ? 1 : at >= t0 - 7 * DAY ? 2 : at >= t0 - 30 * DAY ? 3 : 4;
};

/**
 * «Your chats»: the person's past conversations in this brand, newest first, grouped by when. Picking one reopens it as it
 * was (old proposals come back as text only). Each row has «⋯»: rename, or delete it from the list (asks first).
 */
export function ChatHistory({ brandId, current, onPick, onNew, onDeleted }: {
  brandId: string; current: string | null; onPick: (id: string) => void; onNew: () => void; onDeleted: (id: string) => void;
}) {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; title: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    api<{ chats: Row[] }>(`/v1/help/chats?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => { if (alive) setRows(r.chats); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [brandId]);
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.hh-menu, .hh-more')) setMenu(null); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [menu]);

  async function rename() {
    if (!edit) return;
    const title = edit.title.trim();
    setEdit(null);
    if (!title) return;
    setRows((r) => r?.map((x) => (x.id === edit.id ? { ...x, title } : x)) ?? r);
    await api(`/v1/help/chats/${encodeURIComponent(edit.id)}`, { method: 'PATCH', body: JSON.stringify({ title }) }).catch(() => undefined);
  }
  async function remove(id: string) {
    setDel(null);
    setRows((r) => r?.filter((x) => x.id !== id) ?? r);
    onDeleted(id);
    await api(`/v1/help/chats/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
  }

  const rel = new Intl.RelativeTimeFormat(lang === 'es' ? 'es' : 'en', { numeric: 'auto' });
  const ago = (at: number) => {
    const m = Math.round((at - Date.now()) / 60000);
    return Math.abs(m) < 1 ? t('help.justNow') : Math.abs(m) < 60 ? rel.format(m, 'minute') : Math.abs(m) < 1440 ? rel.format(Math.round(m / 60), 'hour')
      : Math.abs(m) < 43200 ? rel.format(Math.round(m / 1440), 'day') : rel.format(Math.round(m / 43200), 'month');
  };
  const newBtn = (
    <button type="button" className="hh-new" onClick={onNew}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      {t('help.histNew')}
    </button>
  );
  if (error) return <div className="col g8">{newBtn}<p className="t-sm t-mute">{t('help.histError')}</p></div>;
  if (!rows) return <p className="t-sm t-mute">{t('help.thinking')}</p>;
  if (!rows.length) return <div className="col g8">{newBtn}<p className="t-sm t-mute">{t('help.histEmpty')}</p></div>;

  const needle = q.trim().toLowerCase();
  const shown = needle ? rows.filter((r) => r.title.toLowerCase().includes(needle)) : rows;
  return (
    <div className="hh" ref={wrap}>
      <div className="hh-top">
        <p className="label" style={{ margin: 0 }}>{t('help.history')}</p>
        {newBtn}
      </div>
      {rows.length > 5 && <input className="hh-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('help.histSearch')} aria-label={t('help.histSearch')} />}
      {!shown.length && <p className="t-sm t-mute">{t('help.histNone')}</p>}
      {GROUPS.map((g, gi) => {
        const list = shown.filter((r) => groupOf(r.at) === gi);
        if (!list.length) return null;
        return (
          <section key={g} className="hh-group" aria-label={t(g as StringKey)}>
            <p className="hh-when">{t(g as StringKey)}</p>
            {list.map((r) => (
              <div key={r.id} className={`hh-row${r.id === current ? ' is-on' : ''}${menu === r.id ? ' is-menu' : ''}`}>
                {edit?.id === r.id ? (
                  <form className="hh-edit" onSubmit={(e) => { e.preventDefault(); void rename(); }}>
                    <input autoFocus value={edit.title} maxLength={80} onChange={(e) => setEdit({ id: r.id, title: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEdit(null); } }} aria-label={t('help.histRename')} />
                    <button type="submit" className="hh-ok">{t('help.histSave')}</button>
                  </form>
                ) : del === r.id ? (
                  <div className="hh-ask" role="alert">
                    <span>{t('help.histDelAsk')}</span>
                    <button type="button" className="hh-yes" onClick={() => void remove(r.id)}>{t('help.histDelYes')}</button>
                    <button type="button" className="hh-no" onClick={() => setDel(null)}>{t('help.histCancel')}</button>
                  </div>
                ) : (
                  <>
                    <button type="button" className="hh-pick" onClick={() => onPick(r.id)} aria-current={r.id === current || undefined}>
                      <b>{r.title}</b>{r.at > 0 && <span>{ago(r.at)}</span>}
                    </button>
                    <button type="button" className="hh-more" aria-haspopup="menu" aria-expanded={menu === r.id} aria-label={t('help.histMore', { title: r.title })}
                      onClick={() => setMenu((m) => (m === r.id ? null : r.id))}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
                    </button>
                    {menu === r.id && (
                      <div className="hh-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => { setMenu(null); setEdit({ id: r.id, title: r.title }); }}>✏️ {t('help.histRename')}</button>
                        <button type="button" role="menuitem" className="is-del" onClick={() => { setMenu(null); setDel(r.id); }}>🗑️ {t('help.histDelete')}</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
