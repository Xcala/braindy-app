// Writes a client site's key for the AI receptionist to a file (never to the screen), to load it into the
// site's Secret Manager with --data-file and then delete the file.
//   gcloud secrets versions access latest --secret voice-forward-secret --project braindy-brand-guideline > master.txt
//   npx tsx server/scripts/voice-site-key.ts <brandId> master.txt site-key.txt
//   firebase functions:secrets:set BRAINDY_VOZ_KEY --data-file site-key.txt --project <site project>
//   del master.txt site-key.txt
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [brandId, masterFile, outFile] = process.argv.slice(2);
if (!brandId || !masterFile || !outFile) {
  console.error('Usage: voice-site-key.ts <brandId> <master-file> <out-file>');
  process.exit(1);
}
const master = readFileSync(masterFile, 'utf8').trim();
writeFileSync(outFile, createHmac('sha256', master).update(`site:${brandId}`).digest('hex'));
console.log(`Key for ${brandId} written to ${outFile}. Load it with --data-file and delete the file.`);
