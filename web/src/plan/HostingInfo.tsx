import type { Term } from './hostingData';
import { useL, type Tx } from './HostingParts';

const TERMS: Array<{ id: Term; name: string; long?: Tx; body: Tx }> = [
  { id: 'mcp', name: 'MCP', long: ['Model Context Protocol', 'Model Context Protocol'], body: ['Un estándar abierto que deja que una IA como Claude o ChatGPT use herramientas externas. Conectamos tu sitio por MCP, así tu IA puede leerlo y editarlo con los mismos permisos que tu editor. Tú pides el cambio en tus palabras y queda en borrador hasta que lo apruebas. El uso de la IA corre por tu suscripción.', 'An open standard that lets an AI like Claude or ChatGPT use outside tools. We connect your site over MCP, so your AI can read and edit it with the same permissions as your editor. You ask for the change in your words and it stays a draft until you approve it. AI usage runs on your own subscription.'] },
  { id: 'cms', name: 'CMS', long: ['sistema de gestión de contenido', 'content management system'], body: ['La parte del editor donde manejas contenido que se repite: artículos de blog, productos, proyectos o eventos. Cada uno es una “entrada” y tiene su propia página.', 'The part of the editor where you manage repeating content: blog posts, products, projects or events. Each one is an “entry” with its own page.'] },
  { id: 'transfer', name: 'Transferencia', long: ['GB al mes', 'GB per month'], body: ['Los datos que se descargan cuando alguien abre tu sitio. Calculamos las visitas con una página típica de 2 MB.', 'The data downloaded when someone opens your site. We estimate visits with a typical 2 MB page.'] },
  { id: 'https', name: 'HTTPS y certificado SSL', body: ['El candado del navegador. Cifra lo que viaja entre tu sitio y quien lo visita. Lo instalamos y renovamos solos.', 'The browser padlock. It encrypts what travels between your site and the visitor. We install and renew it ourselves.'] },
  { id: 'dns', name: 'DNS', body: ['La configuración que conecta tu dominio (tuempresa.com) con tu sitio. La hacemos nosotros.', 'The setting that connects your domain (yourcompany.com) to your site. We do it.'] },
  { id: 'pwa', name: 'PWA', long: ['app web progresiva', 'progressive web app'], body: ['Un sitio que se instala en el celular como una app, con ícono, notificaciones y uso sin conexión, sin pasar por las tiendas.', 'A site that installs on the phone like an app, with an icon, notifications and offline use, without the app stores.'] },
  { id: 'sla', name: 'SLA', long: ['acuerdo de nivel de servicio', 'service level agreement'], body: ['Un compromiso por contrato de tiempos de respuesta y disponibilidad, con lo que pasa si no se cumple.', 'A contractual commitment on response times and uptime, with what happens if it is not met.'] },
  { id: 'dkim', name: 'SPF, DKIM y DMARC', body: ['Registros del dominio que prueban que tus correos vienen de ti. Sin ellos, tus newsletters caen en spam.', 'Domain records that prove your emails come from you. Without them, your newsletters land in spam.'] },
];

const FAQ: Array<[Tx, Tx]> = [
  [['¿Cuánto cuesta hacer el sitio?', 'How much does building the site cost?'], ['Se paga una sola vez, con precio fijo. Sitio: USD 1.800 (COP 7.190.000), hasta 6 páginas en 3 semanas. Marca + Sitio: USD 3.000 (COP 11.990.000) en 4 semanas. Ambos incluyen 3 meses del plan Pro; después pagas solo el plan mensual. Pagas 50 % al empezar y 50 % al entregar, o todo al empezar con 10 % de descuento.', 'It is paid once, at a fixed price. Site: USD 1,800 (COP 7,190,000), up to 6 pages in 3 weeks. Brand + Site: USD 3,000 (COP 11,990,000) in 4 weeks. Both include 3 months of the Pro plan; after that you only pay the monthly plan. You pay 50% to start and 50% on delivery, or all upfront with a 10% discount.']],
  [['¿Ustedes hacen los cambios de contenido?', 'Do you make the content changes?'], ['En los planes de hosting, no: el contenido lo maneja tu equipo con el editor, y cada plan da más formas de hacerlo. Si tienes fee mensual de agencia con Braindy, sí: dentro del fee hacemos el diseño, el montaje y los cambios, y el hosting se paga aparte.', 'On hosting plans, no: your team handles content with the editor, and each plan gives more ways to do it. If you have a monthly agency fee with Braindy, yes: within the fee we do design, build and changes, and hosting is paid apart.']],
  [['¿Hay permanencia mínima? ¿Cómo cancelo?', 'Is there a minimum term? How do I cancel?'], ['No hay permanencia en el plan mensual: cancelas avisando con 30 días. El plan anual se paga por adelantado, no es reembolsable y sigue activo hasta el final del año.', 'No minimum term on the monthly plan: cancel with 30 days’ notice. The yearly plan is paid upfront, is not refundable and stays active until the end of the year.']],
  [['¿De quién es el sitio si me voy?', 'Who owns the site if I leave?'], ['Tu dominio, tus textos, tus fotos y tus datos son tuyos. Si cancelas, te entregamos una copia completa del contenido y te ayudamos a apuntar el dominio a donde quieras.', 'Your domain, texts, photos and data are yours. If you cancel, we hand over a full copy of the content and help you point the domain wherever you want.']],
  [['¿Cómo pago y facturan?', 'How do I pay and get invoiced?'], ['Pagas en línea con tarjeta, de forma segura con Stripe, desde el botón de cada plan: la suscripción se renueva sola cada mes o cada año y la cancelas cuando quieras. También puedes pagar por transferencia desde Braindy App. En Colombia emitimos factura electrónica y se suma el IVA del 19 %.', 'You pay online by card, securely with Stripe, from each plan’s button: the subscription renews monthly or yearly and you cancel anytime. You can also pay by bank transfer from Braindy App. In Colombia we issue an electronic invoice and 19% VAT is added.']],
  [['¿El dominio está incluido?', 'Is the domain included?'], ['La conexión del dominio sí. El registro (por ejemplo tuempresa.com) se paga a quien lo vende, normalmente entre 15 y 25 USD al año, siempre a tu nombre.', 'Connecting the domain, yes. The registration (e.g. yourcompany.com) is paid to the registrar, usually 15–25 USD a year, always in your name.']],
  [['¿Puedo cambiar de plan?', 'Can I change plans?'], ['Sí, cuando quieras. Al subir, las funciones nuevas se activan de inmediato y pagas la diferencia proporcional.', 'Yes, anytime. When you upgrade, the new features turn on right away and you pay the prorated difference.']],
  [['¿Qué pasa si paso de las visitas de mi plan?', 'What if I go over my plan’s visits?'], ['El sitio no se cae. Te avisamos y te recomendamos el plan que corresponde.', 'The site does not go down. We let you know and recommend the right plan.']],
  [['¿Qué significa “caída” y “horas hábiles”?', 'What do “outage” and “business hours” mean?'], ['Una caída es cuando el sitio no abre para nadie. Las horas hábiles son de lunes a viernes, de 8:00 a 18:00, hora Colombia. Una caída reportada el viernes a las 5:00 p. m. con plazo de 2 horas se atiende antes de las 9:00 a. m. del lunes.', 'An outage is when the site does not open for anyone. Business hours are Monday to Friday, 8:00–18:00 Colombia time. An outage reported Friday at 5:00 p.m. with a 2-hour window is handled before 9:00 a.m. Monday.']],
  [['¿Cómo se cobra una app o un dashboard?', 'How is an app or a dashboard billed?'], ['En dos partes: el desarrollo inicial se cotiza como proyecto, y después pagas cada mes el plan Enterprise y los módulos que uses, que cubren infraestructura, operación y soporte.', 'In two parts: the initial build is quoted as a project, then you pay the Enterprise plan and the modules you use each month, covering infrastructure, operation and support.']],
];

/** Glossary: each term folds open; "¿Qué es…?" links in the plan cards open them. */
export function Glossary() {
  const L = useL();
  return (
    <section>
      <h2>{L(['Términos ', 'Terms '])}<b>{L(['que vas a ver', 'you will see'])}</b></h2>
      <p className="hp-lead">{L(['Los usamos porque tu equipo técnico los reconoce. Toca uno para ver qué significa en tu sitio.', 'We use them because your tech team knows them. Tap one to see what it means for your site.'])}</p>
      <div className="hp-terms">
        {TERMS.map((x) => (
          <details key={x.id} id={`hp-t-${x.id}`}>
            <summary><span><b>{x.id === 'transfer' ? L(['Transferencia', 'Transfer']) : x.id === 'https' ? L(['HTTPS y certificado SSL', 'HTTPS and SSL certificate']) : x.id === 'dkim' ? L(['SPF, DKIM y DMARC', 'SPF, DKIM and DMARC']) : x.name}</b>{x.long && <span> · {L(x.long)}</span>}</span></summary>
            <p>{L(x.body)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  const L = useL();
  return (
    <section>
      <h2>{L(['Preguntas ', 'Frequently asked '])}<b>{L(['frecuentes', 'questions'])}</b></h2>
      <div className="hp-faq">{FAQ.map(([q, a]) => <details key={q[0]}><summary>{L(q)}</summary><p>{L(a)}</p></details>)}</div>
    </section>
  );
}

const ROWS = (r: Array<[Tx, ...Array<Tx | [Tx, Tx]>]>) => r;
const STACK = ROWS([
  [['Publicación', 'Publishing'], ['Firebase Hosting + CDN global', 'Firebase Hosting + global CDN'], ['Firebase Hosting + CDN global', 'Firebase Hosting + global CDN'], ['Firebase Hosting + CDN global', 'Firebase Hosting + global CDN']],
  [['Contenido', 'Content'], ['Cloud Firestore', 'Cloud Firestore'], ['Cloud Firestore', 'Cloud Firestore'], ['Cloud Firestore en proyecto propio', 'Cloud Firestore in its own project']],
  [['Archivos', 'Files'], ['Cloud Storage', 'Cloud Storage'], ['Cloud Storage', 'Cloud Storage'], ['Cloud Storage', 'Cloud Storage']],
  [['Acceso', 'Access'], ['Firebase Authentication', 'Firebase Authentication'], ['Firebase Authentication con roles', 'Firebase Authentication with roles'], ['Firebase Authentication con roles', 'Firebase Authentication with roles']],
  [['Servidor', 'Server'], [['No tiene', 'None'], ['Con tienda: funciones para los pagos.', 'With a store: functions for payments.']], [['Cloud Run para MCP y WhatsApp', 'Cloud Run for MCP and WhatsApp'], ['Escala a cero cuando no se usa.', 'Scales to zero when idle.']], ['Cloud Run para la lógica de la app', 'Cloud Run for the app logic']],
]);
const FITS = ROWS([
  [['Fotos optimizadas', 'Optimized photos'], ['~300 KB cada una', '~300 KB each'], ['~3.000', '~3,000'], ['~15.000', '~15,000'], ['~30.000', '~30,000']],
  [['Videos de 1 minuto en HD', '1-minute HD videos'], ['~25 MB cada uno', '~25 MB each'], ['~40', '~40'], ['~200', '~200'], ['~400', '~400']],
  [['PDF de 10 páginas', '10-page PDFs'], ['~2 MB cada uno', '~2 MB each'], ['~500', '~500'], ['~2.500', '~2,500'], ['~5.000', '~5,000']],
  [['Páginas de texto', 'Text pages'], ['~50 KB cada una, sin fotos', '~50 KB each, no photos'], ['~20.000', '~20,000'], ['~100.000', '~100,000'], ['~200.000', '~200,000']],
]);
const VS = ROWS([
  [['Sitio básico editable', 'Basic editable site'], [['$4,17', '$4.17'], ['Esencial anual', 'Esencial yearly']], [['$17–19', '$17–19'], ['Light', 'Light']], [['$8', '$8'], ['Premium', 'Premium']], [['$15', '$15'], ['Basic', 'Basic']], ['No aplica', 'N/A']],
  [['Con CMS o blog', 'With CMS or blog'], [['$4,17', '$4.17'], ['Esencial anual, hasta 300 entradas', 'Esencial yearly, up to 300 entries']], [['$29', '$29'], ['Core', 'Core']], [['$25', '$25'], ['Business', 'Business']], [['$25', '$25'], ['Premium', 'Premium']], ['No aplica', 'N/A']],
  [['Con tienda', 'With a store'], [['$20,83', '$20.83'], ['Pro anual + tienda', 'Pro yearly + store']], ['$29–39', '$29–39'], [['$45', '$45'], ['Commerce', 'Commerce']], ['desde $29', 'from $29'], [['$29–79', '$29–79'], ['+ comisión por venta', '+ fee per sale']]],
  [['Diseño hecho para tu marca', 'Design made for your brand'], [['Sí, por NicoMarca', 'Yes, by NickMark'], ['Se cotiza una vez, aparte', 'Quoted once, apart']], ['Plantillas', 'Templates'], ['Temas', 'Themes'], ['Lo haces tú', 'You do it'], ['Temas', 'Themes']],
  [['Editar desde WhatsApp', 'Edit from WhatsApp'], ['Sí, plan Ultra', 'Yes, Ultra plan'], ['No', 'No'], ['No', 'No'], ['No', 'No'], ['No', 'No']],
  [['Conexión MCP lista para usar', 'Ready-to-use MCP connection'], ['Sí, configurada por nosotros', 'Yes, set up by us'], ['Para desarrolladores', 'For developers'], ['Para desarrolladores', 'For developers'], ['Para desarrolladores', 'For developers'], ['Para desarrolladores', 'For developers']],
  [['Soporte de una persona', 'Support from a person'], ['Sí, por WhatsApp', 'Yes, on WhatsApp'], ['Centro de ayuda', 'Help center'], ['Correo y chat', 'Email and chat'], ['Correo', 'Email'], ['Chat 24/7', '24/7 chat']],
]);

function Table({ head, rows, us, sub }: { head: string[]; rows: Array<[Tx, ...Array<Tx | [Tx, Tx]>]>; us?: number; sub?: boolean }) {
  const L = useL();
  const cell = (c: Tx | [Tx, Tx]) => (Array.isArray(c[0]) ? <>{L(c[0] as Tx)}<small>{L(c[1] as Tx)}</small></> : L(c as Tx));
  return (
    <div className="hp-table">
      <table>
        <thead><tr>{head.map((h, i) => <th key={i} scope="col" className={i === us ? 'hp-us' : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(([label, ...cells]) => {
            const [first, ...rest] = sub ? cells : [null, ...cells];
            return (
              <tr key={label[0]}>
                <th scope="row">{L(label)}{first && <small>{L(first as Tx)}</small>}</th>
                {rest.map((c, i) => <td key={i} className={i + 1 === us ? 'hp-us' : undefined}>{cell(c as Tx)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** For the client's tech team: the stack, what fits in each plan, and how it compares; folded by default. */
export function Tech() {
  const L = useL();
  const steps: Array<[Tx, Tx]> = [
    [['No hay un servidor propio que se pueda hackear.', 'There is no server of your own to hack.'], ['Un sitio en WordPress corre en un servidor con PHP y plugins que hay que actualizar; por ahí entra la mayoría de ataques. Tu sitio son archivos ya construidos que entrega la red de Google.', 'A WordPress site runs on a server with PHP and plugins that need updating; most attacks come in that way. Your site is prebuilt files delivered by Google’s network.']],
    [['La base de datos no está abierta a internet.', 'The database is not open to the internet.'], ['El contenido vive en Cloud Firestore, sin dirección, puerto ni contraseña que atacar: solo se llega a través de Firebase.', 'Content lives in Cloud Firestore, with no address, port or password to attack: it is only reached through Firebase.']],
    [['Cada lectura y escritura se verifica.', 'Every read and write is checked.'], ['Las reglas de seguridad dicen quién puede hacer qué: los visitantes solo leen lo publicado y solo los editores autorizados escriben.', 'Security rules say who can do what: visitors only read what is published and only authorized editors write.']],
    [['Las claves nunca llegan al navegador.', 'Keys never reach the browser.'], ['En Ultra, con créditos y en Enterprise, un servicio en Cloud Run guarda las claves en Secret Manager y hace las llamadas.', 'On Ultra, with credits and on Enterprise, a Cloud Run service keeps the keys in Secret Manager and makes the calls.']],
  ];
  const facts: Array<[Tx, Tx]> = [
    [['Dónde quedan los servidores', 'Where the servers are'], ['Datos y servicios en centros de datos de Google en Estados Unidos (región us-central1, Iowa). Las páginas se entregan desde la red de caché global.', 'Data and services in Google data centers in the United States (us-central1, Iowa). Pages are served from the global cache network.']],
    [['Cifrado', 'Encryption'], ['Todo viaja por HTTPS (TLS 1.2 o superior) y se guarda cifrado en reposo con AES-256, como hace Google Cloud por defecto.', 'Everything travels over HTTPS (TLS 1.2 or higher) and is stored encrypted at rest with AES-256, as Google Cloud does by default.']],
    [['Disponibilidad', 'Availability'], ['Servicios administrados por Google, con redundancia entre zonas. No hay un servidor único que se pueda caer.', 'Services managed by Google, with redundancy across zones. There is no single server to go down.']],
    [['Certificaciones de la infraestructura', 'Infrastructure certifications'], ['Google Cloud cuenta con ISO/IEC 27001, 27017, 27018 y SOC 1, 2 y 3.', 'Google Cloud holds ISO/IEC 27001, 27017, 27018 and SOC 1, 2 and 3.']],
  ];
  return (
    <section className="hp-tech" aria-label={L(['Para tu equipo técnico', 'For your tech team'])}>
      <details>
        <summary>{L(['Para tu equipo técnico: la tecnología detrás', 'For your tech team: the technology behind'])}</summary>
        <div className="hp-tech-body">
          <div className="hp-callout">
            <h3>{L(['Qué significa “sin servidor ni base de datos expuestos”', 'What “no exposed server or database” means'])}</h3>
            <ol>{steps.map(([b, m]) => <li key={b[0]}><b>{L(b)}</b> <span className="hp-mute">{L(m)}</span></li>)}</ol>
          </div>
          <Table head={['', L(['Esencial y Pro', 'Esencial and Pro']), 'Ultra', 'Enterprise']} rows={STACK} />
          <div className="hp-facts">{facts.map(([b, s]) => <div key={b[0]}><b>{L(b)}</b><span>{L(s)}</span></div>)}</div>
        </div>
      </details>
      <details>
        <summary>{L(['¿Cuánto le cabe a cada plan?', 'How much fits in each plan?'])}</summary>
        <div className="hp-tech-body">
          <Table head={[L(['Tipo de archivo', 'File type']), 'Esencial · 1 GB', 'Pro · 5 GB', 'Ultra · 10 GB']} rows={FITS} sub />
          <p className="hp-small">{L(['Las fotos se optimizan solas al subirlas. Los videos en YouTube o Vimeo no ocupan espacio de tu plan. Un sitio corporativo típico usa entre 100 y 300 MB.', 'Photos are optimized on upload. Videos on YouTube or Vimeo use no space on your plan. A typical corporate site uses 100–300 MB.'])}</p>
        </div>
      </details>
      <details>
        <summary>{L(['Frente a otras plataformas', 'Versus other platforms'])}</summary>
        <div className="hp-tech-body">
          <Table head={['', 'Braindy', 'Wix', 'WordPress.com', 'Webflow', 'Shopify']} rows={VS} us={1} />
          <p className="hp-small">{L(['Solo el valor mensual del plan, en USD con pago anual y sin impuestos, a octubre de 2026. En las otras plataformas el diseño lo haces tú o pagas a alguien; con Braindy se cotiza una vez. Los precios pueden cambiar: confirma en la página de cada plataforma.', 'Monthly plan price only, in USD paid yearly and before tax, as of October 2026. On other platforms you do the design or pay someone; with Braindy it is quoted once. Prices may change: check each platform’s page.'])}</p>
        </div>
      </details>
    </section>
  );
}

export function Sign() {
  const L = useL();
  return (
    <footer className="hp-sign">
      <p>{L(['Lo hace NicoMarca. Sus ', 'Made by NickMark. Powered by his '])}Br<b>ai</b>ns{L([' lo aceleran.', '.'])}</p>
      <p className="hp-fine">{L(['Precios sin IVA (en Colombia se suma el 19 %). Los valores en COP son fijos y no cambian con la tasa de cambio durante tu periodo de facturación.', 'Prices before VAT (19% is added in Colombia). COP prices are fixed and do not change with the exchange rate during your billing period.'])}</p>
    </footer>
  );
}
