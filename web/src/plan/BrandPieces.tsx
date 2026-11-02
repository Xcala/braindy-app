import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Cur } from './hostingData';
import { Featured, useL } from './HostingParts';
import './hosting.css';

/** Mi plan · Brand tab: design of on-brand pieces with the Brains (Braindy credits), with its own currency switch. */
export function BrandPieces({ brandName }: { brandName: string }) {
  const { lang } = useI18n();
  const L = useL();
  const [cur, setCur] = useState<Cur>(lang === 'es' ? 'cop' : 'usd');
  return (
    <div className="hp">
      <div className="hp-bar">
        <span className="hp-eyebrow">{L(['Braindy · Diseño de piezas on-brand', 'Braindy · On-brand piece design'])}</span>
        <div className="hp-seg" role="group" aria-label="Currency">{(['usd', 'cop'] as const).map((c) => <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}>{c.toUpperCase()}</button>)}</div>
      </div>
      <Featured cur={cur} brandName={brandName} />
    </div>
  );
}
