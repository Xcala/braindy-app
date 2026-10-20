import { fill, type PublicCopy } from './copy';

type Acceptance = { name: string; role?: string; email?: string; at?: { _seconds?: number; seconds?: number } };

/** After signing: payment result (from Stripe's return) and the signed copy (print to PDF). */
export function Signed({ c, acceptance, paid, locale, onPayAgain }: {
  c: PublicCopy; acceptance: Acceptance; paid: string | null; locale: string; onPayAgain: () => void;
}) {
  const secs = acceptance.at?._seconds ?? acceptance.at?.seconds;
  const when = secs ? new Date(secs * 1000).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' }) : '';
  return (
    <section className="mx-auto col g16 px-5 py-10 sm:px-14" aria-labelledby="signed-h">
      {paid === '1' && (
        <div className="stage col g12 rounded-[20px] p-6 sm:p-9 print:hidden" role="status">
          <h2 className="d-lg" id="signed-h" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{c.paidOk}</span></h2>
          <p className="t-lg muted">{fill(c.paidOkBody, { email: acceptance.email ?? '' })}</p>
          <a className="btn btn-white self-start" href="/login">{c.openApp}</a>
        </div>
      )}
      {paid === '0' && (
        <div className="card col g8 print:hidden" role="alert" style={{ borderColor: '#F5D98A', background: '#FFFBF0' }}>
          <span className="w7">{c.paidNo}</span><span className="t-sm">{c.paidNoBody}</span>
          <button className="btn btn-primary btn-sm self-start" onClick={onPayAgain}>{c.payAgain}</button>
        </div>
      )}
      <div className="card row between g16 wrap">
        <div className="col g4">
          <span className="t-sm t-mute">{fill(c.signedBy, { name: acceptance.name })}{acceptance.role ? ` · ${acceptance.role}` : ''}</span>
          <span style={{ font: "500 32px/1.1 'Red Hat Display', sans-serif" }}>{acceptance.name}</span>
          <span className="t-xs t-mute">{when}</span>
        </div>
        <button className="btn btn-secondary print:hidden" onClick={() => window.print()}>{c.signedCopy}</button>
      </div>
    </section>
  );
}
