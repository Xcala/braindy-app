// Wishlist history: what clients have asked Braindy (the app) for so far, as public entries every client sees.
// No client or brand names. Idempotent (fixed ids, existing entries keep their votes). Usage: tsx scripts/seed-wishlist.ts [--dry-run]
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../src/firebase.js';

type Entry = { by?: { brandId: string; name: string }; id: string; kind: 'improve' | 'fix'; status: 'new' | 'planned' | 'doing' | 'done'; asked: string; done?: string; text: string; reply: string };

const HISTORY: Entry[] = [
  { id: 'h-pedir-whatsapp', kind: 'improve', status: 'done', asked: '2026-10-28', done: '2026-11-02',
    text: 'Poder pedir por WhatsApp, sin entrar a la app.', reply: 'Listo: escribe o manda una nota de voz al WhatsApp de Braindy y queda como pedido.' },
  { id: 'h-pedido-idioma', kind: 'fix', status: 'done', asked: '2026-10-30', done: '2026-10-30',
    text: 'Mi pedido salió en inglés y en una categoría que no era.', reply: 'Corregido: el pedido queda en el idioma en que lo escribes, y lo de dominios y sitios va a Web.' },
  { id: 'h-notas-voz', kind: 'improve', status: 'done', asked: '2026-11-02', done: '2026-11-03', by: { brandId: 'sanuteam', name: 'Ana' },
    text: 'Poder mandar notas de voz en vez de escribir.', reply: 'Listo: en Nuevo pedido, Grabar nota de voz (hasta 3 minutos). También en esta Wishlist.' },
  { id: 'h-instalar-app', kind: 'improve', status: 'done', asked: '2026-10-31', done: '2026-11-02',
    text: 'Tener Braindy como una app en el celular.', reply: 'Listo: se instala desde el navegador y abre aunque la señal sea mala.' },
  { id: 'h-whatsapp-marca', kind: 'fix', status: 'done', asked: '2026-11-03', done: '2026-11-03',
    text: 'Que WhatsApp no me pregunte cada vez para qué marca es.', reply: 'Listo: entiende la marca por lo que escribes, o usa la última.' },
  { id: 'h-comentar-sitio', kind: 'improve', status: 'done', asked: '2026-11-03', done: '2026-11-03',
    text: 'Poder señalar la parte exacta del sitio web que quiero cambiar.', reply: 'Listo: en Sitios y apps, modo comentario: haz clic en la parte del sitio y escribe.' },
  { id: 'h-aprobado-archivos', kind: 'improve', status: 'done', asked: '2026-11-04', done: '2026-11-04',
    text: 'Encontrar en un solo lugar todo lo que ya aprobé.', reply: 'Listo: Mi marca › Entregas guarda cada pieza aprobada.' },
  { id: 'h-editar-comentarios', kind: 'improve', status: 'done', asked: '2026-11-05', done: '2026-11-06',
    text: 'Poder editar o borrar un comentario que escribí mal.', reply: 'Listo: en tus comentarios aparece Editar y Borrar.' },
  { id: 'h-renombrar-archivos', kind: 'improve', status: 'done', asked: '2026-11-05', done: '2026-11-06',
    text: 'Cambiarle el nombre a mis archivos.', reply: 'Listo: en Biblioteca, menú del archivo › Renombrar.' },
  { id: 'h-reuniones', kind: 'improve', status: 'done', asked: '2026-11-05', done: '2026-11-06',
    text: 'Ver las notas de nuestras reuniones en la app.', reply: 'Listo: salen en Inicio.' },
  { id: 'h-resultados', kind: 'improve', status: 'done', asked: '2026-11-04', done: '2026-11-10',
    text: 'Ver los números de redes, anuncios y ventas sin pedir un informe.', reply: 'Listo en las marcas con Resultados: se actualizan cada día.' },
  { id: 'h-zoom', kind: 'improve', status: 'done', asked: '2026-11-11', done: '2026-11-11',
    text: 'Hacer zoom a una pieza larga (una tabla, una página) para leerla bien.', reply: 'Listo: haz clic en la imagen para verla en grande; otro clic la acerca al doble.' },
  { id: 'h-encontrar-cosas', kind: 'fix', status: 'done', asked: '2026-11-08', done: '2026-11-11',
    text: 'Me cuesta encontrar dónde está cada cosa en la app.', reply: 'Agregamos el botón de ayuda (abajo a la derecha): pregúntale y te lleva al lugar.' },
  { id: 'h-menu-corto', kind: 'improve', status: 'doing', asked: '2026-11-08',
    text: 'Un menú más corto y más claro.', reply: 'En camino: 4 secciones arriba (Inicio, Pedidos, Mi marca, Resultados) y 3 abajo, con pestañas dentro.' },
  { id: 'h-recordatorio', kind: 'improve', status: 'planned', asked: '2026-11-03',
    text: 'Que me avisen un día antes de la fecha de entrega.', reply: 'Planeada: llegará por WhatsApp.' },
  { id: 'h-entregas-whatsapp', kind: 'improve', status: 'planned', asked: '2026-11-08',
    text: 'Recibir las entregas por WhatsApp y aprobarlas desde ahí con un botón.', reply: 'Planeada.' },
  { id: 'h-voz', kind: 'improve', status: 'new', asked: '2026-11-08',
    text: 'Poder hablarle a Braindy por voz, como una llamada, y que haga lo que le pido.', reply: '' },
];

const dry = process.argv.includes('--dry-run');
const at = (d: string) => Timestamp.fromDate(new Date(`${d}T15:00:00Z`));
let created = 0, updated = 0;
for (const e of HISTORY) {
  const ref = db.collection('wishes').doc(e.id);
  const snap = await ref.get();
  const data = { text: e.text, kind: e.kind, status: e.status, reply: e.reply, public: true, createdAt: at(e.asked), ...(e.done ? { doneAt: at(e.done) } : {}) };
  if (snap.exists) updated++; else created++;
  console.log(`${snap.exists ? 'update' : 'create'} ${e.id} · ${e.status} · ${e.text}`);
  // Votes stay as they are; a new entry starts with none.
  if (!dry) await ref.set(snap.exists ? data : { ...data, votes: [] }, { merge: true });
  // Who asked: admin-only, never on the public entry.
  if (!dry && e.by) await db.collection('wishCredits').doc(e.id).set(e.by, { merge: true });
}
console.log(`\n${dry ? '(dry run) ' : ''}${created} new · ${updated} updated · ${HISTORY.length} in the history`);
process.exit(0);
