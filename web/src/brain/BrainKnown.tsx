import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { bold } from '../components/Scan';
import type { Area } from './knowledge';
import type { Item } from './items';

/**
 * «Lo que sabe de tu marca», in words: the palette and type, the tone, what it learned from you, the rules.
 * Each line is a dot on the map; tapping it shows it there.
 */
export function BrainKnown({ items, onPick, onArea }: { items: Item[]; onPick: (id: string) => void; onArea: (a: Area) => void }) {
  const { t } = useI18n();
  const colors = items.filter((x) => x.kind === 'color');
  const fonts = items.filter((x) => x.kind === 'font');
  const voice = items.filter((x) => x.area === 'voice');
  const learned = items.filter((x) => (x.kind === 'changed' || x.kind === 'liked') && !x.retired)
    .sort((a, b) => Number(b.kind === 'changed') - Number(a.kind === 'changed') || (+(b.at ?? 0) - +(a.at ?? 0))).slice(0, 5);
  const rules = items.filter((x) => x.kind === 'rule');
  const line = (x: Item, text?: string) => <li key={x.id}><button type="button" onClick={() => onPick(x.id)}>{text ?? bold(x.label)}</button></li>;
  return (
    <section className="col g16" aria-labelledby="h-bb-known">
      <h2 className="h2" id="h-bb-known">{t('bb.known')}</h2>
      <div className="bb-known">
        <article className="card card-tight col g12">
          <div className="row between g8"><h3 className="h3">{t('bb.area.identity')}</h3><Link to="/brand/visual" className="t-sm w7 bb-more">{t('bb.see')}</Link></div>
          {colors.length ? (
            <div className="bb-pal">{colors.slice(0, 10).map((c) => <button key={c.id} type="button" title={`${c.label} ${c.hex ?? ''}`} aria-label={c.label} style={{ background: c.hex }} onClick={() => onPick(c.id)} />)}</div>
          ) : <p className="t-sm t-mute">{t('bb.gap.colors')}</p>}
          {fonts.length > 0 && <ul className="bb-lines">{fonts.map((f) => line(f, `${f.label}${f.detail ? ` · ${f.detail}` : ''}`))}</ul>}
        </article>
        <article className="card card-tight col g12">
          <div className="row between g8"><h3 className="h3">{t('bb.area.voice')}</h3><Link to="/brand/essence" className="t-sm w7 bb-more">{t('bb.see')}</Link></div>
          {voice.length ? <ul className="bb-lines">{voice.slice(0, 4).map((x) => line(x))}</ul> : <p className="t-sm t-mute">{t('bb.gap.voice')}</p>}
        </article>
        <article className="card card-tight col g12 bb-known-wide">
          <div className="col g4"><h3 className="h3">{t('bl.better')}</h3><p className="t-sm t-mute">{t('bl.betterSub')}</p></div>
          {learned.length
            ? <ul className="bb-lines">{learned.map((x) => <li key={x.id}><button type="button" onClick={() => onPick(x.id)}><span className="bb-dot" data-k={x.kind} />{x.label}</button></li>)}</ul>
            : <p className="t-sm t-mute">{t('bl.betterEmpty')}</p>}
        </article>
        <article className="card card-tight col g12 bb-known-rules">
          <div className="row between g8"><h3 className="h3">{t('bb.rules')}</h3>{rules.length > 6 && <button type="button" className="t-sm w7 bb-more" onClick={() => onArea('rules')}>{t('bb.seeAll', { n: rules.length })}</button>}</div>
          {rules.length ? <ul className="bb-lines">{rules.slice(0, 6).map((x) => line(x))}</ul> : <p className="t-sm t-mute">{t('bb.rulesEmpty')}</p>}
        </article>
      </div>
    </section>
  );
}
