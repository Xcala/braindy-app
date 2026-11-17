import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { publicApi } from '../proposals/api';
import { PUBLIC_COPY } from '../proposals/public/copy';
import { usePublicTracking } from '../proposals/public/usePublicTracking';
import { AcceptDialog } from '../proposals/public/AcceptDialog';
import { Signed } from '../proposals/public/Signed';
import { Braintrust, Days, FromAtoB, Hero, Options, Proof, Talk, type PublicProposal as Data } from '../proposals/public/Sections';
import type { OptionKey } from '../proposals/types';
import { HowWeWork, OfferSummary } from '../proposals/public/OfferSections';
import { DeckBar, useDeck } from '../proposals/public/DeckBar';
import { DayBraintrust, DayHero } from '../proposals/public/DaySections';
import { WorkReel } from '../proposals/public/WorkReel';
import { Credentials } from '../proposals/public/Credentials';
import { AppTour, StartSteps } from '../proposals/public/StartAndApp';
import { useReveal } from '../proposals/public/useReveal';
import '../proposals/public/day.css';
import { BOS, PHASES, PHASE_KEYS, pathOf, type Offer } from '../proposals/offer/catalog';

/** The page a prospect opens from a tracked link. No login; every open and reading time is recorded. */
export function PublicProposal() {
  const { token = '' } = useParams();
  const [data, setData] = useState<(Data & { sessionId: string }) | null>(null);
  const [failed, setFailed] = useState(false);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [accepting, setAccepting] = useState<OptionKey | null>(null);

  // One load per token: each load counts as an open, so never fetch twice (React dev re-runs effects).
  const loaded = useRef<string | null>(null);
  useEffect(() => {
    if (loaded.current === token) return;
    loaded.current = token;
    publicApi.load(token).then((d) => { setData(d); setLang(d.lang === 'es' ? 'es' : 'en'); }).catch(() => setFailed(true));
  }, [token]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  usePublicTracking(token, data?.sessionId);
  const deck = useDeck(!!data);
  useReveal(!!data);

  const c = PUBLIC_COPY[lang];
  if (failed) return <div className="flex min-h-full items-center justify-center p-6"><p className="t-lg t-mute">{c.notFound}</p></div>;
  if (!data) return <div className="flex min-h-full items-center justify-center" aria-busy="true"><img src="/brand/braindy-logo.svg" alt="Braindy" className="h-8 opacity-60" /></div>;

  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const dateLabel = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const validLabel = data.validUntil ? new Date(`${data.validUntil}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined;
  // New proposals carry the offer (phases + BOS at this client's price); older ones keep the three paths.
  const offer = (data.options as Record<string, unknown> | undefined)?.offer as Offer | undefined;
  const offerLabel = offer ? [...PHASE_KEYS.filter((k) => k in offer.phases).map((k) => PHASES[k].name), ...(offer.bos ? [`BOS ${BOS[offer.bos].name}`] : [])].join(' + ') : undefined;
  const pick = () => setAccepting(offer ? (pathOf(offer) as OptionKey) : data.recommended ?? 'transform');
  const openFile = async (id: string) => window.open(await publicApi.fileUrl(token, id), '_blank', 'noopener');

  return (
    <div className={offer ? 'pp-day' : undefined} style={offer ? undefined : { background: '#fff' }}>
      <div className={`mx-auto max-w-[90rem]`}>
        {offer ? <DayHero c={c} p={data} dateLabel={dateLabel} validLabel={validLabel} lang={lang} onLang={setLang} />
          : <Hero c={c} p={data} dateLabel={dateLabel} validLabel={validLabel} lang={lang} onLang={setLang} />}
        {offer ? <><WorkReel c={c} lang={lang} /><Credentials lang={lang} /></> : <Proof c={c} />}
        <FromAtoB c={c} p={data} />
        {offer ? <DayBraintrust c={c} /> : <Braintrust c={c} />}
        {offer ? <HowWeWork lang={lang} offer={offer} /> : <Days c={c} />}
        {offer ? <OfferSummary lang={lang} offer={offer} cur={data.currency ?? 'cop'} accepted={!!data.acceptance} onAccept={pick} />
          : <Options c={c} p={data} onPick={setAccepting} />}
        {offer && <StartSteps c={c} />}
        {offer && <AppTour lang={lang} />}
        {data.acceptance && <Signed c={c} acceptance={data.acceptance} locale={locale} paid={new URLSearchParams(window.location.search).get('paid')}
          onPayAgain={() => publicApi.pay(token).then((r) => { if (r.payUrl) window.location.href = r.payUrl; }).catch(() => undefined)} />}
        <Talk c={c} files={data.files} onFile={openFile} onAccept={pick} />
        <footer className="row between g16 wrap px-5 py-10 sm:px-14" style={{ borderTop: '1px solid var(--line)' }}>
          <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: '1.75rem' }} />
          <p className="t-sm t-mute">{c.footer}</p>
        </footer>
      </div>
      <DeckBar deck={deck} lang={lang} />
      {accepting && (
        <AcceptDialog c={c} token={token} option={accepting} label={offerLabel} validLabel={validLabel}
          prospectName={data.prospect.company || data.prospect.name || ''} onClose={() => setAccepting(null)} />
      )}
    </div>
  );
}
