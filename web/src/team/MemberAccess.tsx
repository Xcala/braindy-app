import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { PROFILES, SECTIONS, profileOf, sectionsOf, type MemberLike, type Profile, type Section } from './sections';

export const SECTION_LABEL: Record<Section, StringKey> = {
  brand: 'nav.brand', requests: 'nav.requests', files: 'nav.assets', apps: 'nav.apps', research: 'nav.research',
  results: 'nav.report', learn: 'cr.nav', accesses: 'nav.accesses', billing: 'perm.billing',
};

/** What a profile means for the member doc: "all" is an owner, "team" a member with the default, "view" a picked list. */
export function profilePatch(p: Exclude<Profile, 'custom'>) {
  return p === 'all' ? { role: 'client_owner', sections: null }
    : p === 'team' ? { role: 'client_member', sections: null }
    : { role: 'client_member', sections: [...PROFILES.view] };
}

/** NickMark only: a profile in one tap, or section by section. Everything saves at once. */
export function MemberAccess({ member, onChange, disabled }: { member: MemberLike; onChange: (patch: { role?: string; sections?: string[] | null }) => void; disabled?: boolean }) {
  const { t } = useI18n();
  const mine = sectionsOf(member);
  const profile = profileOf(member);
  const toggle = (s: Section) => {
    const next = mine.includes(s) ? mine.filter((x) => x !== s) : [...mine, s];
    onChange({ sections: SECTIONS.filter((x) => next.includes(x)) });
  };
  return (
    <div className="col g8">
      <div className="seg self-start" role="radiogroup" aria-label={t('perm.profile')} style={{ flexWrap: 'wrap' }}>
        {(['all', 'team', 'view'] as const).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={profile === p} className={profile === p ? 'is-on' : ''} disabled={disabled}
            title={t(`perm.${p}Hint` as StringKey)} onClick={() => onChange(profilePatch(p))}>{t(`perm.${p}` as StringKey)}</button>
        ))}
        {profile === 'custom' && <button type="button" role="radio" aria-checked className="is-on" disabled>{t('perm.custom')}</button>}
      </div>
      <div className="row g6 wrap" role="group" aria-label={t('perm.sections')}>
        {SECTIONS.map((s) => {
          const on = mine.includes(s);
          return (
            <button key={s} type="button" aria-pressed={on} disabled={disabled} onClick={() => toggle(s)} className="t-xs w7"
              style={{ borderRadius: 999, padding: '5px 10px', cursor: 'pointer', border: `1px solid ${on ? 'var(--azul)' : 'var(--line)'}`,
                background: on ? '#EAF0FF' : '#fff', color: on ? 'var(--azul)' : 'var(--graphite, #6B7280)', textDecoration: on ? 'none' : 'line-through' }}>
              {on ? '✓ ' : ''}{t(SECTION_LABEL[s])}
            </button>
          );
        })}
      </div>
    </div>
  );
}
