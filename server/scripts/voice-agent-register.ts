// Registers (or updates) a brand's AI receptionist agent: `voiceAgents/{agentId}` → brand + site form endpoint.
//   npx tsx server/scripts/voice-agent-register.ts <agentId> <brandId> [forwardUrl]
import { db } from '../src/firebase.js';

const [agentId, brandId, forwardUrl = ''] = process.argv.slice(2);
if (!agentId || !brandId) { console.error('Usage: voice-agent-register.ts <agentId> <brandId> [forwardUrl]'); process.exit(1); }
const brand = await db.doc(`brands/${brandId}`).get();
if (!brand.exists) { console.error(`Brand ${brandId} does not exist`); process.exit(1); }
await db.doc(`voiceAgents/${agentId}`).set({ brandId, forwardUrl, active: true, provider: 'elevenlabs', updatedAt: new Date() }, { merge: true });
await db.doc(`brands/${brandId}`).set({ voiceAgent: { agentId, active: true, channels: ['web'] } }, { merge: true });
console.log(`voiceAgents/${agentId} → ${brandId}${forwardUrl ? ` (forward to ${forwardUrl})` : ''}`);
