import { useI18n } from '../i18n/I18nProvider';
import type { Proposal } from './types';
import type { StringKey } from '../i18n/strings';

export const fmtWhen = (d: Date | undefined, lang: string) =>
  d ? d.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export function ActivityLine({ activity }: { activity: Proposal['lastActivity'] }) {
  const { t, lang } = useI18n();
  if (!activity) return <span className="t-sm t-mute">—</span>;
  const when = fmtWhen(activity.at?.toDate(), lang);
  const what = t(`proposals.activity.${activity.type}` as StringKey, { channel: activity.channel ? t(`proposals.channel.${activity.channel}` as StringKey) : '', to: activity.to ?? '', name: activity.name ?? '' });
  const strong = ['opened', 'reopened', 'accepted'].includes(activity.type);
  return (
    <span className="t-sm truncate">
      {strong ? <strong>{what}</strong> : <span className="t-mute">{what}</span>} {when && <span className="t-mute">· {when}</span>}
    </span>
  );
}
