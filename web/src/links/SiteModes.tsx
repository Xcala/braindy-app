import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { SiteFrame } from './useSpot';

/** How the client changes the site: tell us (comments, voice notes, adjustments) or do it themself in the site's own editor. */
export type SiteMode = 'ask' | 'edit';

const read = (k: string): SiteMode | null => { try { const v = localStorage.getItem(k); return v === 'ask' || v === 'edit' ? v : null; } catch { return null; } };
const keep = (k: string, m: SiteMode) => { try { localStorage.setItem(k, m); } catch { /* private window: the choice lasts this visit */ } };

/**
 * The two ways, for a site that has its own editor (it says so through the bridge). The first time, an intro asks;
 * the choice is kept per site and per browser, and the switch in the bar changes it any time.
 * «Hazlo tú» loads the site's editor in the same frame on the page being viewed; «Dímelo» takes the frame back to that page.
 */
export function useSiteMode(linkId: string, spot: SiteFrame, enabled: boolean) {
  const key = `bd.siteMode.${linkId}`;
  const [mode, setModeState] = useState<SiteMode>('ask');
  const [intro, setIntro] = useState(false);
  const before = useRef(spot.page);
  const current = useRef<SiteMode>('ask');
  const editor = enabled ? spot.editor : null;

  const setMode = useCallback((m: SiteMode) => {
    setIntro(false); keep(key, m);
    if (current.current === m || !editor) return;
    if (m === 'edit') {
      before.current = spot.page;
      let path = '/';
      try { const u = new URL(spot.page); path = u.pathname + u.search; } catch { /* home */ }
      spot.load(editor + encodeURIComponent(path));
    } else spot.load(before.current);
    current.current = m; setModeState(m);
  }, [editor, key, spot]);

  // When the site says it has an editor: the saved choice, or the intro the first time.
  useEffect(() => {
    if (!editor) return;
    const saved = read(key);
    if (saved === 'edit') setMode('edit'); else if (!saved) setIntro(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return { mode, setMode, intro, canEdit: !!editor };
}

/** The switch in the viewer's bar. */
export function ModeSwitch({ mode, setMode }: { mode: SiteMode; setMode: (m: SiteMode) => void }) {
  const { t } = useI18n();
  return (
    <div className="seg lview-modes" role="group" aria-label={t('sm.how')}>
      {(['ask', 'edit'] as const).map((m) => (
        <button key={m} type="button" className={mode === m ? 'is-on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>{t(`sm.${m}`)}</button>
      ))}
    </div>
  );
}

/** The first time: two cards over the site, one per way. */
export function ModeIntro({ setMode }: { setMode: (m: SiteMode) => void }) {
  const { t } = useI18n();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return (
    <div className="smode" role="dialog" aria-modal="false" aria-labelledby="smode-t">
      <div className="smode-card col g16">
        <h2 id="smode-t" className="h3" style={{ margin: 0 }}>{t('sm.how')}</h2>
        <div className="smode-grid">
          {(['ask', 'edit'] as const).map((m, i) => (
            <button key={m} ref={i === 0 ? first : undefined} type="button" className="smode-opt col g8" onClick={() => setMode(m)}>
              <span className="smode-ico" aria-hidden="true">{m === 'ask' ? '💬' : '✏️'}</span>
              <b>{t(`sm.${m}Title`)}</b>
              <span className="t-sm t-mute">{t(`sm.${m}Body`)}</span>
            </button>
          ))}
        </div>
        <p className="t-xs t-mute" style={{ margin: 0 }}>{t('sm.later')}</p>
      </div>
    </div>
  );
}
