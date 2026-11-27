import { Link } from 'react-router';
import { useBrands } from '../../../brands/BrandProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import type { StringKey } from '../../../i18n/strings';
import type { AiHealth } from '../../../costs/useAiHealth';

/** What the API sends since SA4 (errors and tasks carry their request); older API revisions leave these fields out. */
export type Task = AiHealth['tasks']['stuck'][number] & { requestId?: string | null };
export type Failure = AiHealth['errors'][number] & { taskId?: string | null; requestId?: string | null };
export type Health = Omit<AiHealth, 'errors' | 'tasks'> & { errors: Failure[]; tasks: AiHealth['tasks'] & { stuck: Task[]; fellBack?: Task[] } };

const KINDS = ['help', 'whatsapp_agent', 'whatsapp_intent', 'billing_import', 'onboarding:brain-draft', 'plan', 'report', 'watch', 'group_analysis', 'other'];

/** Number helpers in the reader's language: «2,9 s» and «US$ 3,40» in Spanish. */
export function useFmt() {
  const { t, lang } = useI18n();
  const { brands } = useBrands();
  const dec = (s: string) => (lang === 'es' ? s.replace('.', ',') : s);
  const secs = (ms: number) => (!ms ? '—' : ms >= 10_000 ? `${Math.round(ms / 1000)} s` : dec(`${(ms / 1000).toFixed(1)} s`));
  const usd = (v: number) => `US$ ${dec(v.toFixed(2))}`;
  const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0} %`;
  const kind = (k: string) => { const key = k.replace(/^brain:/, ''); return KINDS.includes(key) ? t(`aih.k.${key}` as StringKey) : key; };
  const brand = (id: string | null | undefined) => (!id || id === '—' ? t('aih.noBrand') : brands.find((b) => b.id === id)?.name ?? id);
  const when = (ms: number) => new Date(ms).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
  const brain = (b: string) => (b ? b[0]!.toUpperCase() + b.slice(1) : '');
  return { t, secs, usd, pct, kind, brand, when, brain };
}

/** «See request»: selects the request's brand and opens it (same as Today). Nothing when the request is unknown. */
export function RequestLink({ requestId, brandId, label }: { requestId?: string | null; brandId?: string | null; label: string }) {
  const { select } = useBrands();
  if (!requestId || !brandId) return null;
  return <Link to={`/requests/${requestId}?brand=${brandId}`} onClick={() => select(brandId)} className="btn btn-secondary btn-sm">{label}</Link>;
}
