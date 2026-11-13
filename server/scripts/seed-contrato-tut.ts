// LOCAL EMULATOR ONLY: a contract ready to sign for the tutorial video «Firmar el contrato en un paso». It is made from the
// real template with demo terms; the contractor's ID number and address are masked (•••), so the video shows no personal data.
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8281 npx tsx scripts/seed-contrato-tut.ts poner|quitar
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { completeTerms, fill, pickTerms } from '../src/contracts/terms.js';
import { DEFAULT_CHECKLIST, PRESETS, mondayOf } from '../src/contracts/schedule.js';
import { TEMPLATE_VERSION } from '../src/contracts/template.js';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Only against the emulator: set FIRESTORE_EMULATOR_HOST');
const db = getFirestore(initializeApp({ projectId: 'braindy-brand-guideline' }), 'braindy-app');
const brand = db.doc('brands/quimiolab'), ref = brand.collection('contracts').doc('demo-tutorial');

if (process.argv[2] === 'quitar') {
  const prev = (await ref.get()).get('prevContractId') ?? null;
  await brand.set({ onboarding: { contractId: prev } }, { merge: true });
  await ref.delete();
  console.log('contrato demo quitado; contractId =', prev);
} else {
  const start = mondayOf();
  const terms = completeTerms(pickTerms({ objeto: 'Sistema de marca y Brand OS', 'plazo.meses': '3', 'plazo.inicio': start, 'valor.monto': '4500', 'valor.moneda': 'USD', 'pago.frecuencia': 'mensual', 'pago.cuota': '1500' }), 'Representante de Quimiolab');
  const prevContractId = (await brand.get()).get('onboarding.contractId') ?? null;
  await ref.set({
    status: 'sent', templateVersion: TEMPLATE_VERSION, terms, scope: 'Identidad, manual y plantillas; Brand OS con agentes de contenido.',
    schedule: PRESETS.brand3m(start), checklist: DEFAULT_CHECKLIST,
    signer: { email: 'video-demo@braindy.test', name: 'Representante de Quimiolab' },
    sentText: fill(terms, { nombre: 'Nicolás Márquez', tipoDoc: 'C.C.', doc: '•••', correo: 'nicolas@braindy.co', direccion: '•••' }),
    signatures: { contractor: { name: 'Nicolás Márquez', tipoDoc: 'C.C.', doc: '•••', cargo: 'Contratista', email: 'nicolas@braindy.co', signedAt: new Date().toISOString() } },
    sentAt: FieldValue.serverTimestamp(), prevContractId,
  });
  await brand.set({ onboarding: { contractId: 'demo-tutorial' } }, { merge: true });
  console.log('contrato demo listo para firmar');
}
process.exit(0);
