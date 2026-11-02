import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useBrands, type Brand } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { BrandHero } from '../brands/BrandHero';
import { BrandMark } from '../brands/BrandMark';
import { Logos } from '../brands/identity/Logos';
import { Colors, brandColors, type Color } from '../brands/identity/Colors';
import { Typography } from '../brands/identity/Typography';
import { Strategy, hasStrategy, type BrainDoc } from '../brands/identity/Strategy';
import { Primal, type PrimalDoc } from '../brands/identity/Primal';
import { Voice, type VoiceDoc } from '../brands/identity/Voice';
import { DeckConcept, deckShots } from '../brands/identity/DeckConcept';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { GroupWork } from '../brands/GroupWork';
import { GroupAnalysis, LearningsSection } from '../brains/BrainPanels';
import { useAuth } from '../auth/AuthProvider';
import { useCanApprove } from '../requests/useCanApprove';
import { BrandFiles, type BrandFile } from '../brands/identity/BrandFiles';
import { useCopy } from '../brands/identity/useCopy';
import { SectionHead } from '../components/SectionHead';
import { useI18n } from '../i18n/I18nProvider';
import { BrandEditor, type EditableIdentity } from '../brands/edit/BrandEditor';
import type { StringKey } from '../i18n/strings';

type Identity = {
  logos?: { primary?: string; secondary?: string; icon?: string; variations?: string[] };
  colors?: Color[];
  typography?: Array<Record<string, string>>;
  galleryAssets?: Array<{ id?: string; url?: string; name?: string; chosen?: boolean }>;
  concept?: Array<{ url: string; kind: 'hero' | 'design-concept'; caption?: string }>;
  documents?: BrandFile[];
};

export function MyBrand() {
  const { current, brands } = useBrands();
  const { t } = useI18n();
  const identity = useBrandDoc(current?.id, 'context/identity');
  const voiceDoc = useBrandDoc(current?.id, 'context/voice');
  const brainDoc = useBrandDoc(current?.id, 'context/brain');
  const primalDoc = useBrandDoc(current?.id, 'context/primal');
  const legacyShots = deckShots(useLegacyAssets(current?.id));
  const { copied, copy } = useCopy();
  const canAsk = useCanApprove(current?.id);
  const isAdmin = useAuth().profile?.role === 'admin';
  const [editing, setEditing] = useState(false);
  // My brand is split in views (see SubNav): essence (the default), visual and documents. Research is its own page.
  const { view = 'essence' } = useParams<{ view?: string }>();
  const active = useActiveSection([identity.loading, voiceDoc.loading, brainDoc.loading, current?.id, view]);
  const bar = useRef<HTMLDivElement>(null);
  // On mobile the bar is one scrolling line: keep the current section chip in view.
  useEffect(() => {
    const el = bar.current, on = el?.querySelector<HTMLElement>('a.is-on');
    if (el && on && el.scrollWidth > el.clientWidth) el.scrollTo({ left: on.offsetLeft - 12, behavior: 'smooth' });
  }, [active]);

  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  const id = (identity.data ?? {}) as Identity;
  // Concept images sent by the Braindy connector replace the ones rescued from the old LogoDeck.
  const shots = id.concept?.length ? id.concept : legacyShots;
  const voice = voiceDoc.data as (VoiceDoc & { archetype?: string[] }) | null;
  const colors = brandColors(id.colors ?? []);
  const children = brands.filter((b) => b.groupId === current.id);
  const loading = identity.loading || voiceDoc.loading;
  const brain = brainDoc.data as BrainDoc | null;
  const primal = primalDoc.data as PrimalDoc | null;

  const sections: Array<{ id: string; label: StringKey; show: boolean; view: 'essence' | 'visual' | 'docs' }> = [
    { id: 'family', label: 'brand.children', show: children.length > 0, view: 'essence' },
    { id: 'overview', label: 'group.overview', show: children.length > 0, view: 'essence' },
    { id: 'primal', label: 'primal.title', show: current.kind !== 'group', view: 'essence' },
    { id: 'logos', label: 'brand.logos', show: !!id.logos, view: 'visual' },
    { id: 'docs', label: 'bf.title', show: (id.documents ?? []).length > 0, view: 'docs' },
    { id: 'concept', label: 'brand.concept', show: shots.length > 0, view: 'visual' },
    { id: 'strategy', label: 'brand.strategy', show: hasStrategy(brain), view: 'essence' },
    { id: 'colors', label: 'brand.colors', show: colors.length > 0, view: 'visual' },
    { id: 'type', label: 'brand.typography', show: (id.typography ?? []).length > 0, view: 'visual' },
    { id: 'voice', label: 'brand.voice', show: !!voice, view: 'essence' },
  ];
  const visible = sections.filter((s) => s.show && s.view === view);
  const on = (key: string) => visible.some((s) => s.id === key);
  const num = (key: string) => visible.findIndex((s) => s.id === key) + 1;
  const font = ((id.typography ?? [])[0] as { fontFamily?: string; name?: string } | undefined)?.fontFamily ?? ((id.typography ?? [])[0] as { name?: string } | undefined)?.name;

  return (
    <div className="col g48 brandpage">
      {view === 'essence' && <BrandHero brand={current} logo={id.logos?.primary ?? current.logoUrl ?? undefined}
        essence={voice?.essence?.title} tags={(voice?.archetype ?? []).slice(0, 3)} accent={colors[0]?.hex} />}
      {isAdmin && (
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: view === 'essence' ? -32 : 0 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>{t('be.open')}</button>
        </div>
      )}
      {editing && <BrandEditor key={current.id} brandId={current.id} identity={id as EditableIdentity} voice={voice} brain={brain} primal={primal} onClose={() => setEditing(false)} />}

      {view === 'visual' && visible.length > 1 && (
        <div ref={bar} className="stickybar brandbar row between g16 wrap rounded-[20px]" style={{ marginTop: -24, padding: '12px 16px', top: 8 }}>
          <nav className="anchors" aria-label={t('brand.onThisPage')}>
            {visible.map((s) => <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-on' : ''} aria-current={active === s.id ? 'location' : undefined}>{t(s.label)}</a>)}
          </nav>
          {colors.length > 0 && (
            <div className="qrow row g8 wrap">
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

      {on('family') && (
        <section className="col g24" id="family" aria-labelledby="h-family">
          <SectionHead id="family" num={num('family')} title={t('brand.children')} subtitle={t('brand.childrenSub', { n: children.length })} />
          <GroupBrands brands={children} all={brands} />
        </section>
      )}
      {on('overview') && (
        <section className="col g24" id="overview" aria-labelledby="h-overview">
          <SectionHead id="overview" num={num('overview')} title={t('group.overview')} subtitle={t('group.overviewHint', { name: current.name })} />
          <GroupWork group={current} all={brands} />
          <GroupAnalysis groupId={current.id} canAsk={canAsk} />
        </section>
      )}
      {on('primal') && (
        <section className="col g24" id="primal" aria-labelledby="h-primal">
          <SectionHead id="primal" num={num('primal')} title={t('primal.title')} subtitle={t('primal.sub')} />
          <Primal primal={primal} />
        </section>
      )}
      {on('logos') && id.logos && (
        <section className="col g24" id="logos" aria-labelledby="h-logos">
          <SectionHead id="logos" num={num('logos')} title={t('brand.logos')} subtitle={t('brand.logosSub')} />
          <Logos logos={id.logos} />
        </section>
      )}
      {on('docs') && (
        <section className="col g24" id="docs" aria-labelledby="h-docs">
          <SectionHead id="docs" num={num('docs')} title={t('bf.title')} subtitle={t('bf.sub')} />
          <BrandFiles brandId={current.id} files={id.documents ?? []} isAdmin={isAdmin} />
        </section>
      )}
      {on('concept') && (
        <section className="col g24" id="concept" aria-labelledby="h-concept">
          <SectionHead id="concept" num={num('concept')} title={t('brand.concept')} subtitle={t('brand.conceptSub')} />
          <DeckConcept shots={shots} />
        </section>
      )}
      {on('strategy') && (
        <section className="col g24" id="strategy" aria-labelledby="h-strategy">
          <SectionHead id="strategy" num={num('strategy')} title={t('brand.strategy')} subtitle={t('brand.strategySub')} />
          <Strategy brain={brain!} />
        </section>
      )}
      {on('colors') && (
        <section className="col g24" id="colors" aria-labelledby="h-colors">
          <SectionHead id="colors" num={num('colors')} title={t('brand.colors')} subtitle={t('brand.colorsSub', { n: colors.length })} />
          <Colors colors={id.colors ?? []} />
        </section>
      )}
      {on('type') && (
        <section className="col g24" id="type" aria-labelledby="h-type">
          <SectionHead id="type" num={num('type')} title={t('brand.typography')} />
          <Typography fonts={id.typography ?? []} />
        </section>
      )}
      {on('voice') && voice && (
        <section className="col g24" id="voice" aria-labelledby="h-voice">
          <SectionHead id="voice" num={num('voice')} title={t('brand.voice')} />
          <Voice voice={voice} />
        </section>
      )}
      {view === 'essence' && <LearningsSection brandId={current.id} />}
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
