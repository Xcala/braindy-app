import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useMemberNames } from './useMemberNames';
import type { BrandRequest } from './types';

/** Who asked for the request, when and from where: «Lo pidió Laura · sáb 28 nov, 9:48 a. m. · por WhatsApp». */
export function AskedBy({ brandId, r }: { brandId: string; r: BrandRequest }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const names = useMemberNames(brandId);
  if (!r.createdBy) return null;
  const name = r.createdBy === user?.uid ? t('req.you').toLowerCase() : names[r.createdBy] || t('rf.team');
  const at = r.createdAt?.toDate();
  const when = at ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(at) : '';
  const via = r.source === 'whatsapp' ? t('req.viaWa') : '';
  return (
    <p className="t-sm t-mute req-asked" style={{ margin: 0 }}>
      {t('req.askedBy')} <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{name}</strong>{[when, via].filter(Boolean).map((x) => ` · ${x}`).join('')}
    </p>
  );
}
