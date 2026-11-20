import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';

type Row = { id: string; title: string; at: number };

/**
 * «Your chats»: the person's past conversations in this brand (kept on the server), newest first. Picking one reopens
 * it as it was; proposals from before show as text only, so nothing old can be confirmed twice.
 */
export function ChatHistory({ brandId, current, onPick }: { brandId: string; current: string | null; onPick: (id: string) => void }) {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    api<{ chats: Row[] }>(`/v1/help/chats?brandId=${encodeURIComponent(brandId)}`)
      .then((r) => { if (alive) setRows(r.chats); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [brandId]);

  const when = (ms: number) => new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  if (error) return <p className="t-sm t-mute">{t('help.histError')}</p>;
  if (!rows) return <p className="t-sm t-mute">{t('help.thinking')}</p>;
  if (!rows.length) return <p className="t-sm t-mute">{t('help.histEmpty')}</p>;
  return (
    <div className="col g8">
      <p className="label" style={{ margin: 0 }}>{t('help.history')}</p>
      {rows.map((r) => (
        <button key={r.id} type="button" className={`hc-card hc-hist${r.id === current ? ' is-on' : ''}`} onClick={() => onPick(r.id)} aria-current={r.id === current || undefined}>
          <span className="hc-main"><b>{r.title}</b>{r.at > 0 && <span className="t-xs t-mute">{when(r.at)}</span>}</span>
        </button>
      ))}
    </div>
  );
}
