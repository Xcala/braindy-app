import { useEffect, useState } from 'react';
import { useBrands, type Brand } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { BrandHero } from '../brands/BrandHero';
import { BrandMark } from '../brands/BrandMark';
import { Logos } from '../brands/identity/Logos';
import { Colors, brandColors, type Color } from '../brands/identity/Colors';
import { Typography } from '../brands/identity/Typography';
import { Strategy, hasStrategy, type BrainDoc } from '../brands/identity/Strategy';
import { Voice, type VoiceDoc } from '../brands/identity/Voice';
import { GroupWork } from '../brands/GroupWork';
import { GroupAnalysis, LearningsSection } from '../brains/BrainPanels';
import { MeetingsCard } from '../brains/TeamNotes';
import { useAuth } from '../auth/AuthProvider';
import { useCanApprove } from '../requests/useCanApprove';
import { ApprovedWork } from '../brands/identity/ApprovedWork';
import { useCopy } from '../brands/identity/useCopy';
import { SectionHead } from '../components/SectionHead';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

type Identity = {
  logos?: { primary?: string; secondary?: string; icon?: string; variations?: string[] };
  colors?: Color[];
  typography?: Array<Record<string, string>>;
  galleryAssets?: Array<{ id?: string; url?: string; name?: string; chosen?: boolean }>;
};

export function MyBrand() {
  const { current, brands } = useBrands();
  const { t } = useI18n();
  const identity = useBrandDoc(current?.id, 'context/identity');
  const voiceDoc = useBrandDoc(current?.id, 'context/voice');
  const brainDoc = useBrandDoc(current?.id, 'context/brain');
  const { copied, copy } = useCopy();
  const canAsk = useCanApprove(current?.id);
  const isAdmin = useAuth().profile?.role === 'admin';
  const active = useActiveSection([identity.loading, voiceDoc.loading, brainDoc.loading, current?.id]);

  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  const id = (identity.data ?? {}) as Identity;
  const voice = voiceDoc.data as (VoiceDoc & { archetype?: string[] }) | null;
  const colors = brandColors(id.colors ?? []);
  const children = brands.filter((b) => b.groupId === current.id);
  const loading = identity.loading || voiceDoc.loading;
  const brain = brainDoc.data as BrainDoc | null;

  const sections: Array<{ id: string; label: StringKey; show: boolean }> = [
    { id: 'family', label: 'brand.children', show: children.length > 0 },
    { id: 'overview', label: 'group.overview', show: children.length > 0 },
    { id: 'logos', label: 'brand.logos', show: !!id.logos },
    { id: 'strategy', label: 'brand.strategy', show: hasStrategy(brain) },
    { id: 'colors', label: 'brand.colors', show: colors.length > 0 },
    { id: 'type', label: 'brand.typography', show: (id.typography ?? []).length > 0 },
    { id: 'voice', label: 'brand.voice', show: !!voice },
    { id: 'work', label: 'brand.work', show: (id.galleryAssets ?? []).length > 0 },
  ];
  const visible = sections.filter((s) => s.show);
  const num = (key: string) => visible.findIndex((s) => s.id === key) + 1;
  const font = ((id.typography ?? [])[0] as { fontFamily?: string; name?: string } | undefined)?.fontFamily ?? ((id.typography ?? [])[0] as { name?: string } | undefined)?.name;

  return (
    <div className="col g48">
      <BrandHero brand={current} logo={id.logos?.primary ?? current.logoUrl ?? undefined}
        essence={voice?.essence?.title} tags={(voice?.archetype ?? []).slice(0, 3)} accent={colors[0]?.hex} />

      {visible.length > 1 && (
        <div className="stickybar row between g16 wrap rounded-[20px]" style={{ marginTop: -24, padding: '12px 16px', top: 8 }}>
          <nav className="anchors" aria-label={t('brand.onThisPage')}>
            {visible.map((s) => <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-on' : ''} aria-current={active === s.id ? 'location' : undefined}>{t(s.label)}</a>)}
          </nav>
          {colors.length > 0 && (
            <div className="row g8 wrap">
              <span className="label">{t('brand.quickCopy')}</span>
              {colors.slice(0, 3).map((c) => (
                <button key={c.hex} className="qcopy" onClick={() => copy(c.hex!.toUpperCase())}>
                  <i style={{ background: c.hex }} />{copied === c.hex!.toUpperCase() ? t('common.copied') : c.hex!.toUpperCase()}
                </button>
              ))}
              {font && <button className="qcopy" onClick={() => copy(font)}>{font}</button>}
            </div>
          )}
        </div>
      )}

      {loading && <p className="t-mute">{t('common.loading')}…</p>}
      {!loading && visible.length === 0 && <div className="card t-mute">{t('brand.empty')}</div>}

      {children.length > 0 && (
        <section className="col g24" id="family" aria-labelledby="h-family">
          <SectionHead id="family" num={num('family')} title={t('brand.children')} subtitle={t('brand.childrenSub', { n: children.length })} />
          <GroupBrands brands={children} all={brands} />
        </section>
      )}
      {children.length > 0 && (
        <section className="col g24" id="overview" aria-labelledby="h-overview">
          <SectionHead id="overview" num={num('overview')} title={t('group.overview')} subtitle={t('group.overviewHint', { name: current.name })} />
          <GroupWork group={current} all={brands} />
          <GroupAnalysis groupId={current.id} canAsk={canAsk} />
        </section>
      )}
      {id.logos && (
        <section className="col g24" id="logos" aria-labelledby="h-logos">
          <SectionHead id="logos" num={num('logos')} title={t('brand.logos')} subtitle={t('brand.logosSub')} />
          <Logos logos={id.logos} />
        </section>
      )}
      {hasStrategy(brain) && (
        <section className="col g24" id="strategy" aria-labelledby="h-strategy">
          <SectionHead id="strategy" num={num('strategy')} title={t('brand.strategy')} subtitle={t('brand.strategySub')} />
          <Strategy brain={brain!} />
        </section>
      )}
      {colors.length > 0 && (
        <section className="col g24" id="colors" aria-labelledby="h-colors">
          <SectionHead id="colors" num={num('colors')} title={t('brand.colors')} subtitle={t('brand.colorsSub', { n: colors.length })} />
          <Colors colors={id.colors ?? []} />
        </section>
      )}
      {(id.typography ?? []).length > 0 && (
        <section className="col g24" id="type" aria-labelledby="h-type">
          <SectionHead id="type" num={num('type')} title={t('brand.typography')} />
          <Typography fonts={id.typography ?? []} />
        </section>
      )}
      {voice && (
        <section className="col g24" id="voice" aria-labelledby="h-voice">
          <SectionHead id="voice" num={num('voice')} title={t('brand.voice')} />
          <Voice voice={voice} />
        </section>
      )}
      {(id.galleryAssets ?? []).length > 0 && (
        <section className="col g24" id="work" aria-labelledby="h-work">
          <SectionHead id="work" num={num('work')} title={t('brand.work')} subtitle={t('brand.workSub')} />
          <ApprovedWork items={id.galleryAssets ?? []} />
        </section>
      )}
      <LearningsSection brandId={current.id} />
      {isAdmin && <MeetingsCard brandId={current.id} />}
    </div>
  );
}

/** Group view: every brand in the group, with its own sub-brands counted. */
function GroupBrands({ brands, all }: { brands: Brand[]; all: Brand[] }) {
  const { select } = useBrands();
  const { t } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {brands.map((b) => {
        const n = all.filter((x) => x.groupId === b.id).length;
        return (
          <button key={b.id} onClick={() => { select(b.id); window.scrollTo({ top: 0 }); }} className="folder text-left" style={{ cursor: 'pointer' }}>
            <span className="sel" style={{ border: 0, padding: 0, height: 'auto', background: 'none' }}><BrandMark brand={b} /></span>
            <span className="col g4 grow">
              <span className="w7 truncate">{b.name}</span>
              <span className="row g8">
                {b.kind === 'group' && <span className="chip c-group">{t('brand.group')} · {n}</span>}
                <span className={`chip ${b.status === 'archived' ? 'c-archived' : 'c-active'}`}>{t(`status.${b.status}`)}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The section currently in view, to highlight its anchor in the sticky bar (design 26). */
function useActiveSection(deps: unknown[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('main section[id]')];
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { rootMargin: '-80px 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}
