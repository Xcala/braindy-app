import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { CONTRACTOR_FIELDS } from '../types';

/** NickMark's legal data as contractor (natural person). Lives only in config/contractor (admin only). */
export function ContractorForm() {
  const { t } = useI18n();
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { getDoc(doc(db, 'config/contractor')).then((s) => setData((s.data() as Record<string, string>) ?? {})).catch(() => setData({})); }, []);
  if (!data) return null;
  const missing = CONTRACTOR_FIELDS.filter((k) => !data[k]?.trim()).length;
  const save = () => setDoc(doc(db, 'config/contractor'), Object.fromEntries(CONTRACTOR_FIELDS.map((k) => [k, (data[k] ?? '').trim()])))
    .then(() => setMsg(t('ob.a.saved'))).catch(() => setMsg(t('ob.a.error')));

  return (
    <details className="card col g8" open={missing > 0}>
      <summary className="h3" style={{ cursor: 'pointer' }}>{t('ctr.contractor')} {missing > 0 && <span className="chip c-draft">{t('ctr.missing', { n: missing })}</span>}</summary>
      <p className="t-xs t-mute">{t('ctr.contractorSub')}</p>
      {CONTRACTOR_FIELDS.map((k) => (
        <label key={k} className="col g4 t-sm">
          <span className="w7">{t(`ctr.c.${k}` as StringKey)}</span>
          <input className="input" value={data[k] ?? ''} onChange={(e) => setData({ ...data, [k]: e.target.value })} autoComplete="off" />
        </label>
      ))}
      <div className="row g8"><button className="btn btn-secondary btn-sm" onClick={save}>{t('ob.a.save')}</button>{msg && <span className="t-xs" role="status">{msg}</span>}</div>
    </details>
  );
}
