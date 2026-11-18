import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { api } from '../lib/api';
import type { Area } from './knowledge';
import type { Item } from './items';
import { BrainFeed } from './BrainFeed';
import type { BrainEvent } from './useBrainEvents';

type T = (key: StringKey, vars?: Record<string, string | number>) => string;

/** A thing's name in the reader's language (logos, strategy and Primal fields are keys; the rest is the brand's own text). */
export function itemLabel(x: Item, t: T) {
  if (x.kind === 'logo') return t(`bb.it.logo.${x.label}` as StringKey);
  if (x.kind === 'strategy' || x.kind === 'primal') return t(`bb.it.${x.label}` as StringKey);
  return x.label;
}

/**
 * Beside the map: what the tapped dot is (where it came from, whether it goes into each piece, what it links to,
 * «Esto ya no aplica»), or the list of an area, or the feed of what it learned.
 */
export function BrainSide({ brandId, items, selected, focus, found, events, fresh, onPick, onArea, onClear, canEditRules }: {
  brandId: string; items: Item[]; selected: string | null; focus: Area | null; found: Item[] | null; events: BrainEvent[]; fresh: Set<string>;
  onPick: (id: string | null) => void; onArea: (a: Area | null) => void; onClear: () => void; canEditRules: boolean;
}) {
  const { t, lang } = useI18n();
  const it = selected ? items.find((x) => x.id === selected) : undefined;
  const day = (d: Date | null) => d?.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';

  if (it) {
    const linked = items.filter((x) => it.links.includes(x.id) || x.links.includes(it.id));
    return (
      <section className="card bb-side col g12" aria-live="polite">
        <div className="row between g8">
          <span className="label" style={{ margin: 0 }}>{t(`bb.k.${it.kind}` as StringKey)} · {t(`bb.area.${it.area}` as StringKey)}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPick(null)}>{t('bb.close')}</button>
        </div>
        <div className="row g12" style={{ alignItems: 'flex-start' }}>
          {it.hex && <span className="bb-swatch" style={{ background: it.hex }} />}
          <p className="t-md w7" style={{ margin: 0 }}>{itemLabel(it, t)}</p>
        </div>
        {it.detail && <p className="t-sm t-mute" style={{ margin: 0 }}>{it.detail}</p>}
        <p className={`bb-use-tag t-xs w7${it.used ? ' is-on' : ''}`}>{t(it.used ? 'bb.inUse' : 'bb.kept')}</p>
        <p className="t-xs t-mute" style={{ margin: 0 }}>{t(it.used ? 'bb.inUseD' : `bb.keptD.${it.kind === 'liked' || it.kind === 'changed' ? 'learn' : 'other'}` as StringKey)}</p>
        {(it.at || it.requestId) && (
          <p className="t-sm" style={{ margin: 0 }}>
            {it.at && <span className="t-mute">{t('bb.since', { d: day(it.at) })} </span>}
            {it.requestId && <Link to={`/requests/${it.requestId}`} className="w7" style={{ color: 'var(--azul)' }}>{t('bb.openRequest')}</Link>}
          </p>
        )}
        {linked.length > 0 && (
          <div className="col g8">
            <span className="label" style={{ margin: 0 }}>{t('bb.linked')}</span>
            <ul className="bb-links">{linked.slice(0, 8).map((x) => <li key={x.id}><button type="button" onClick={() => onPick(x.id)}><span className="bb-dot" data-k={x.kind} />{itemLabel(x, t)}</button></li>)}</ul>
          </div>
        )}
        {it.learning && <Forget brandId={brandId} item={it} />}
        {it.kind === 'rule' && canEditRules && <Link to="/brand/essence#strategy" className="btn btn-secondary btn-sm self-start">{t('bb.editRules')}</Link>}
      </section>
    );
  }

  const row = (x: Item) => <li key={x.id}><button type="button" onClick={() => onPick(x.id)} className={x.retired ? 'is-gone' : x.used ? '' : 'is-kept'}><span className="bb-dot" data-k={x.kind} style={x.hex ? { background: x.hex } : undefined} />{itemLabel(x, t)}</button></li>;
  if (found) {
    return (
      <section className="card bb-side col g12" aria-live="polite">
        <div className="row between g8">
          <h2 className="h3">{t('bb.found', { n: found.length })}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>{t('bb.close')}</button>
        </div>
        <ul className="bb-links bb-scroll">{found.map(row)}</ul>
      </section>
    );
  }
  if (focus) {
    // Forgotten things stay listed (struck through) so they can be undone later.
    const list = items.filter((x) => x.area === focus).sort((a, b) => Number(!!a.retired) - Number(!!b.retired));
    const used = list.filter((x) => x.used).length;
    return (
      <section className="card bb-side col g12">
        <div className="row between g8">
          <div className="col g4"><h2 className="h3">{t(`bb.area.${focus}` as StringKey)}</h2><p className="t-sm t-mute">{t('bb.areaSub', { n: list.filter((x) => !x.retired).length, used })}</p></div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onArea(null)}>{t('bb.all')}</button>
        </div>
        <ul className="bb-links bb-scroll">{list.map(row)}</ul>
      </section>
    );
  }
  return <BrainFeed events={events} fresh={fresh} />;
}

/** «Esto ya no aplica»: the Brains stop reading this learning (it can be brought back right away). */
function Forget({ brandId, item }: { brandId: string; item: Item }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  const call = async (undo: boolean) => {
    setState('busy');
    try {
      await api(`/v1/brands/${brandId}/brain/forget`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ at: item.learning!.at, text: item.learning!.text, undo }) });
      setState('idle');
    } catch { setState('error'); }
  };
  if (item.retired) return <p className="t-sm" role="status">{t('bb.forgotten')} <button type="button" className="bb-undo w7" onClick={() => call(true)}>{t('bb.undo')}</button></p>;
  return (
    <div className="col g4">
      <button type="button" className="btn btn-secondary btn-sm self-start" disabled={state === 'busy'} onClick={() => call(false)}>{t('bb.forget')}</button>
      <span className="t-xs t-mute">{state === 'error' ? t('bb.forgetError') : t('bb.forgetD')}</span>
    </div>
  );
}
