// Local recording only: the API on this PC signs in as a person (no service-account key), so it cannot sign Storage URLs.
// Preloaded into api-tut, this swaps signed read URLs for a placeholder address that only the recording browser
// resolves (rec.mjs reads the file with the person's own access). No port is opened; writes stay refused.
import { createRequire } from 'node:module';

// the CommonJS build is the one firebase-admin loads
const { File } = createRequire(new URL('../../server/package.json', import.meta.url))('@google-cloud/storage');
File.prototype.getSignedUrl = async function (cfg = {}) {
  if (cfg.action && cfg.action !== 'read') throw new Error('tut: solo lectura');
  return [`https://tut-archivo.invalid/f?b=${encodeURIComponent(this.bucket.name)}&p=${encodeURIComponent(this.name)}`];
};
