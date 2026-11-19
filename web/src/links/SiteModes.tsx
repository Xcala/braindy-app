import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
import type { SiteFrame } from './useSpot';

/** How the client changes the site: tell us (comments, voice notes, adjustments) or do it themself in the site's own editor. */
export type SiteMode = 'ask' | 'edit';

const read = (k: string): SiteMode | null => { try { const v = localStorage.getItem(k); return v === 'ask' || v === 'edit' ? v : null; } catch { return null; } };
const keep = (k: string, m: SiteMode) => { try { localStorage.setItem(k, m); } catch { /* private window: the choice lasts this visit */ } };

/**
 * The editor address for a page. The site names its editor (braindy-editor meta, reported by the bridge):
 * "https://site/admin/editor?p=" gets the page path appended; "https://site/{path}?edit" gets {path} replaced by it.
 */
export function editorUrl(editor: string, page: string) {
  let path = '/', search = '';
  try { const u = new URL(page); path = u.pathname; search = u.search; } catch { /* home */ }
  if (!editor.includes('{path}')) return editor + encodeURIComponent(path + search);
  try {
    const u = new URL(editor.replace(/\/?\{path\}/, path));
    new URLSearchParams(search).forEach((v, k) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
    return u.toString().replace(/=(?=&|$)/g, ''); // "?edit=" back to "?edit"
  } catch { return page; }
}

/**
 * The two ways, for a site that has its own editor (it says so through the bridge). It opens in the editor by default,
 * ready to change things; «Dímelo» (comments pinned on the page) is one click away, and the choice is kept per site.
 */
export function useSiteMode(linkId: string, spot: SiteFrame, enabled: boolean) {
  const key = `bd.siteMode.${linkId}`;
  const [mode, setModeState] = useState<SiteMode>('ask');
  const before = useRef(spot.page);
  const current = useRef<SiteMode>('ask');
  const editor = enabled ? spot.editor : null;

  const setMode = useCallback((m: SiteMode) => {
    keep(key, m);
    if (current.current === m || !editor) return;
    if (m === 'edit') { before.current = spot.page; spot.load(editorUrl(editor, spot.page)); } else spot.load(before.current);
    current.current = m; setModeState(m);
  }, [editor, key, spot]);

  // When the site says it has an editor: straight into it, unless this person chose «Dímelo» for this site.
  useEffect(() => {
    if (!editor) return;
    if (read(key) !== 'ask') setMode('edit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return { mode, setMode, canEdit: !!editor };
}

/**
 * One sign-in: the site's editor gets a session for the person already signed in to Braindy App (when NickMark set up
 * the site's project on the card). The token is asked once per opening and handed over on every load of the frame;
 * without it the editor simply asks to sign in, as before.
 */
export function useSiteSignIn(brandId: string, linkId: string, spot: SiteFrame, enabled: boolean) {
  const token = useRef<string | null>(null);
  const asked = useRef(false);
  const { ready, post } = spot;
  useEffect(() => {
    if (!enabled || !ready) return;
    const hand = () => token.current && post({ type: 'braindy:auth', token: token.current });
    if (token.current) { hand(); return; }
    if (asked.current) return;
    asked.current = true;
    api<{ token: string }>(`/v1/brands/${brandId}/links/${linkId}/editor-token`, { method: 'POST', body: '{}' })
      .then((r) => { token.current = r.token; hand(); }, () => { /* not set up for this site, or no verified email: the editor asks */ });
  }, [brandId, linkId, enabled, ready, post]);
}

/** The switch in the viewer's bar. */
export function ModeSwitch({ mode, setMode }: { mode: SiteMode; setMode: (m: SiteMode) => void }) {
  const { t } = useI18n();
  return (
    <div className="seg lview-modes" role="group" aria-label={t('sm.how')}>
      {(['ask', 'edit'] as const).map((m) => (
        <button key={m} type="button" className={mode === m ? 'is-on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}
          title={t(`sm.${m}Body`)}>{t(`sm.${m}`)}</button>
      ))}
    </div>
  );
}
