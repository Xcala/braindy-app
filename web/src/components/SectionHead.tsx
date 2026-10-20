import type { ReactNode } from 'react';

export function SectionHead({ id, num, title, subtitle, children }: {
  id: string; num: number; title: string; subtitle?: string; children?: ReactNode;
}) {
  return (
    <div className="sec-head flex-wrap">
      <div className="col g8">
        <span className="sec-num">{String(num).padStart(2, '0')}</span>
        <h2 className="h2" id={`h-${id}`}>{title}</h2>
        {subtitle && <p className="t-mute">{subtitle}</p>}
      </div>
      {children && <div className="row g8 wrap">{children}</div>}
    </div>
  );
}
