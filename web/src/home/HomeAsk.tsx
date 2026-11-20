import '../help/help.css';
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';

/** Ask the assistant from the top of Home: the question opens the chat panel and is asked there, in a new conversation. */
export const askAssistant = (q: string) => window.dispatchEvent(new CustomEvent('bd-help-ask', { detail: q }));

/** «What do we do today?»: the chat is the main way in; the rest of Home stays below for whoever prefers to look. */
export function HomeAsk() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [q, setQ] = useState('');
  const first = (profile as { name?: string } | null)?.name?.split(' ')[0];
  const send = (text: string) => { if (text.trim()) { askAssistant(text.trim()); setQ(''); } };

  return (
    <form className="home-ask col g8" onSubmit={(e) => { e.preventDefault(); send(q); }} aria-labelledby="h-ask">
      <label className="h3" id="h-ask" htmlFor="home-ask-q">{t('help.homeTitle', { name: first ? `, ${first}` : '' })}</label>
      <div className="home-ask-row">
        <input id="home-ask-q" className="input" value={q} maxLength={1500} placeholder={t('help.homePh')} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <button type="submit" className="btn btn-primary" disabled={!q.trim()}>{t('help.homeGo')}</button>
      </div>
      <div className="row g8 wrap">
        {(['help.s1', 'help.s2', 'help.s3'] as const).map((k) => <button key={k} type="button" className="chip" onClick={() => send(t(k))}>{t(k)}</button>)}
      </div>
    </form>
  );
}
