// Credentials: what stands behind every piece (from Nicolas's earlier proposals and the braindy.co credentials file):
// the Canal Trece reality, the World Brand Design Society 2024 recognition, client quotes with their number, and the
// brands that have trusted him. Facts only; no testimonial without a figure.
type Lang = 'en' | 'es';
const SITE = '/brand/site';
const REALITY_URL = 'https://www.youtube.com/watch?v=8QEUetG7d80';
const BRANDS = ['Coca-Cola', 'Cemex', 'Experian', 'Alquería', 'Del Vecchio', 'Nutresa', 'Bavaria'];

export function Credentials({ lang }: { lang: Lang }) {
  const s = (es: string, en: string) => (lang === 'es' ? es : en);
  const quotes = [
    { q: s('Braindy transformó cómo presentamos CEMEX HighTech al mundo.', 'Braindy changed how we present CEMEX HighTech to the world.'), who: 'Juan Fernando Girón', role: 'Digital Director · CEMEX HighTech', n: '1.8K+', d: s('suscriptores', 'subscribers') },
    { q: s('El rebrand le dio a Del Vecchio la autoridad para competir a nivel de lujo.', 'The rebrand gave Del Vecchio the authority to compete as a luxury brand.'), who: 'Javier Cárdenas', role: 'CEO · Del Vecchio', n: '+24 %', d: s('en ventas; luego la compró Alquería', 'in sales; then Alquería bought it') },
  ];
  return (
    <section className="col g32 px-5 py-16 sm:px-14" data-section="1">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }} data-reveal>
        <div className="col g12"><span className="sec-num">{s('Credenciales', 'Credentials')}</span>
          <h2 className="d-lg"><span className="w9">{s('Más que una agencia.', 'More than an agency.')}</span> <span className="w3">{s('Lo que respalda cada pieza.', 'What backs every piece.')}</span></h2></div>
        <p className="t-mute" style={{ maxWidth: '24rem', margin: 0 }}>{s('No es una opinión nuestra: el trabajo compite fuera de Colombia y los clientes lo cuentan con cifras.', "Not our opinion: the work competes outside Colombia and clients tell it with numbers.")}</p>
      </div>
      <div className="cred-grid">
        <a className="card cred-reality" href={REALITY_URL} target="_blank" rel="noreferrer" data-reveal style={{ ['--i' as string]: 0 }}>
          <img src={`${SITE}/reality-una-app.webp`} alt={s('Nicolas en el reality Una APP en mi Cabeza', 'Nicolas on the reality show Una APP en mi Cabeza')} loading="lazy" />
          <span className="cred-play" aria-hidden="true">▶</span>
          <div className="cred-over col g8">
            <span className="day-pill">Canal Trece · Silicon Valley</span>
            <span className="h2 w9" style={{ margin: 0 }}>{s('Un reality en Silicon Valley.', 'A reality show in Silicon Valley.')}</span>
            <span className="t-sm">{s('Braindy protagonizó «Una APP en mi Cabeza», el reality de emprendimiento de Canal Trece, y llevó su startup a Silicon Valley.', 'Braindy starred in «Una APP en mi Cabeza», Canal Trece’s startup reality show, and took its startup to Silicon Valley.')}</span>
            <span className="w7 t-sm">▶ {s('Ver el reality', 'Watch the show')}</span>
          </div>
        </a>
        <div className="card col g12 cred-award" data-reveal style={{ ['--i' as string]: 1 }}>
          <img className="cred-award-img" src={`${SITE}/wbds-jero-berrio.webp`} alt={s('Marca de Jero Berrio', 'Jero Berrio brand')} loading="lazy" />
          <img className="cred-award-logo" src={`${SITE}/wbds-logo.webp`} alt="World Brand Design Society Awards" loading="lazy" />
          <span className="h3 w9" style={{ margin: 0 }}>{s('Reconocidos en Londres.', 'Recognized in London.')}</span>
          <span className="t-sm t-mute">{s('World Brand Design Society Awards 2024, por la marca del piloto Jero Berrio.', 'World Brand Design Society Awards 2024, for racing driver Jero Berrio’s brand.')}</span>
        </div>
        <div className="col g12">
          {quotes.map((x, i) => (
            <figure key={x.who} className="card col g12 cred-quote" data-reveal style={{ ['--i' as string]: 2 + i, margin: 0 }}>
              <blockquote className="t-lg w7" style={{ margin: 0 }}>“{x.q}”</blockquote>
              <figcaption className="row between g12 wrap">
                <span className="col"><b className="t-sm">{x.who}</b><span className="t-xs t-mute">{x.role}</span></span>
                <span className="col" style={{ alignItems: 'flex-end' }}><b className="day-num" style={{ fontSize: '1.75rem' }}>{x.n}</b><span className="t-xs t-mute">{x.d}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="row g12 wrap cred-brands" data-reveal>
        <span className="t-sm t-mute">{s('Han confiado en Nicolas:', 'Brands that trusted Nicolas:')}</span>
        {BRANDS.map((b) => <span key={b} className="day-pill w7">{b}</span>)}
        <span className="t-sm t-mute">{s('200+ marcas en 15 años · 3.500+ horas enseñando marketing, diseño y web.', '200+ brands in 15 years · 3,500+ hours teaching marketing, design and web.')}</span>
      </div>
    </section>
  );
}
