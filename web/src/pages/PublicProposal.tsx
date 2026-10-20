import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { publicApi } from '../proposals/api';
import { PUBLIC_COPY } from '../proposals/public/copy';
import { usePublicTracking } from '../proposals/public/usePublicTracking';
import { AcceptDialog } from '../proposals/public/AcceptDialog';
import { Braintrust, Days, FromAtoB, Hero, Options, Proof, Talk, type PublicProposal as Data } from '../proposals/public/Sections';
import type { OptionKey } from '../proposals/types';

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

  const c = PUBLIC_COPY[lang];
  if (failed) return <div className="flex min-h-full items-center justify-center p-6"><p className="t-lg t-mute">{c.notFound}</p></div>;
  if (!data) return <div className="flex min-h-full items-center justify-center" aria-busy="true"><img src="/brand/braindy-logo.svg" alt="Braindy" className="h-8 opacity-60" /></div>;

  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const dateLabel = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const validLabel = data.validUntil ? new Date(`${data.validUntil}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined;
  const openFile = async (id: string) => window.open(await publicApi.fileUrl(token, id), '_blank', 'noopener');

  return (
    <div style={{ background: '#fff' }}>
      <div className="mx-auto max-w-[1440px]">
        <Hero c={c} p={data} dateLabel={dateLabel} validLabel={validLabel} lang={lang} onLang={setLang} />
        <Proof c={c} />
        <FromAtoB c={c} p={data} />
        <Braintrust c={c} />
        <Days c={c} />
        <Options c={c} p={data} onPick={setAccepting} />
        <Talk c={c} files={data.files} onFile={openFile} onAccept={() => setAccepting(data.recommended ?? 'transform')} />
        <footer className="row between g16 wrap px-5 py-10 sm:px-14" style={{ borderTop: '1px solid var(--line)' }}>
          <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: 28 }} />
          <p className="t-sm t-mute">{c.footer}</p>
        </footer>
      </div>
      {accepting && (
        <AcceptDialog c={c} token={token} option={accepting} validLabel={validLabel}
          prospectName={data.prospect.company || data.prospect.name || ''} onClose={() => setAccepting(null)} />
      )}
    </div>
  );
}
