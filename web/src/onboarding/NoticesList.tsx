import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';

type Notice = { id: string; kind: string; sent: boolean; reason?: string | null; waUrl?: string | null; at?: Timestamp };

/** Admin: the day 0-11 WhatsApp notices of a brand; unsent ones carry a ready link to send by hand. */
export function NoticesList({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const [list, setList] = useState<Notice[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'notices'), orderBy('at', 'desc')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Notice)), () => setList([])), [brandId]);
  if (!list.length) return null;
  return (
    <div className="card col g8">
      <h2 className="h3">{t('ob.n.title')}</h2>
      {list.map((n) => (
        <div key={n.id} className="row between g12 wrap t-sm" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
          <span className="w7">{t(`ob.n.${n.kind}` as never)}</span>
          <span className="t-xs t-mute">{n.at?.toDate().toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          {n.sent ? <span className="chip c-approved">{t('ob.n.sent')}</span>
            : n.waUrl ? <a className="btn btn-secondary btn-sm" href={n.waUrl} target="_blank" rel="noreferrer">{t('ob.n.send')}</a>
              : <span className="chip c-draft">{t('ob.n.noNumber')}</span>}
        </div>
      ))}
    </div>
  );
}
