import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { useMySections } from '../team/sections';
import { nicoWhatsApp } from '../lib/nicoWhatsApp';
import { ideasHere, openIdeas } from '../wishes/IdeasPanel';

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  ask: <Svg><path d="M12 5v14M5 12h14" /></Svg>,
  ai: <Svg><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></Svg>,
  ideas: <Svg><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></Svg>,
  nick: <Svg><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2z" /><path d="M9.5 9.5c.3 1.8 1.7 3.6 3.9 4.6l1.1-1.1 1.8.8-.4 1.6c-3.3.2-7.4-3.3-7.6-6.9l1.6-.4.8 1.8z" /></Svg>,
};

/**
 * The corner button's menu (2026-11-12): one tap on the Braindy spark fans out the quick actions above it, each a labelled pill:
 * Ideas, Talk to Nick (WhatsApp), Ask Braindy (the AI help) and, nearest the button and highlighted, New request (option B, 2026-11-12).
 */
export function QuickDial({ onClose, onAi }: { onClose: () => void; onAi: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const current = useBrands().current;
  const { can } = useMySections();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.querySelector<HTMLElement>('a,button')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); document.querySelector<HTMLElement>('.help-fab')?.focus(); } };
    const out = (e: PointerEvent) => { if (!(e.target as Element).closest('.qd-menu, .help-fab')) onClose(); };
    document.addEventListener('keydown', esc);
    document.addEventListener('pointerdown', out);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('pointerdown', out); };
  }, [onClose]);

  const items: Array<{ k: keyof typeof ICONS; node: (cls: string, inner: ReactNode) => ReactNode } | false> = [
    ideasHere(pathname) && { k: 'ideas', node: (cls, inner) => <button type="button" className={cls} onClick={() => { onClose(); openIdeas(); }}>{inner}</button> },
    { k: 'nick', node: (cls, inner) => <a className={cls} href={nicoWhatsApp(current, t('dial.waText'))} target="_blank" rel="noreferrer" onClick={onClose}>{inner}</a> },
    { k: 'ai', node: (cls, inner) => <button type="button" className={cls} onClick={() => { onClose(); onAi(); }}>{inner}</button> },
    can('requests') && !pathname.startsWith('/ask') && { k: 'ask', node: (cls, inner) => <Link to="/ask" className={cls} onClick={onClose}>{inner}</Link> },
  ];

  return (
    <div ref={box} className="qd-menu" role="group" aria-label={t('dial.label')}>
      {items.filter(Boolean).map((it, i) => it && (
        <div key={it.k} className="qd-item" style={{ animationDelay: `${i * 35}ms` }}>
          {it.node(`qd-btn is-${it.k}`, <><span className="qd-ico">{ICONS[it.k]}</span>{t(`dial.${it.k}`)}</>)}
        </div>
      ))}
    </div>
  );
}
