# Phase 0 · Setup runbook

Done when: login works on staging with existing users.

## Repo layout
| Path | What |
|---|---|
| `web/` | Vite + React 19 + TS + Tailwind v4 + react-router 7. Firebase 12 client, database `braindy-app` only |
| `server/` | Cloud Run backend (Node 24, Hono, firebase-admin). Verifies Firebase ID tokens. All AI calls will live here |
| `firestore.rules` | Rules for database `braindy-app` |
| `tests/rules/` | Emulator tests for the rules (`npm run test:rules`) |
| `Dockerfile` | Backend image, built from the repo root |

## Local
```bash
npm install
npm run test:rules          # needs Java 21+ for the Firestore emulator
npm run emulators           # Auth + Firestore emulators, project demo-braindy
npm run dev                 # web on :5173 (copy web/.env.example to web/.env.local)
npm run dev -w server       # API on :8787
```

## Safety boundaries
- `firebase.json` only declares the `braindy-app` database. Deploys never touch `(default)` or the `ai-studio-*` databases.
- `firebase.json` has **no** `storage` block on purpose: the bucket is shared with the old apps and deploying storage rules would replace theirs. Storage for the new app is decided in phase 1.
- Hosting deploys target the new site `braindy-app-staging` only (`--only hosting:staging`).
- The backend's service account gets Firestore access through an IAM condition limited to `databases/braindy-app`.

## Cloud resources (project `braindy-brand-guideline`), in order
| # | Resource | Command (sketch) |
|---|---|---|
| 1 | Enable APIs: Cloud Run, Cloud Build, Artifact Registry | `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com` |
| 2 | Firestore database `braindy-app` (Native, same location as `(default)`, delete protection on) | `gcloud firestore databases create --database=braindy-app --location=<loc> --delete-protection` |
| 3 | Rules + indexes on `braindy-app` only | `firebase deploy --only firestore:braindy-app` |
| 4 | Firebase web app registration "Braindy App" (config → `web/.env.local`) | `firebase apps:create web "Braindy App"` |
| 5 | Hosting site `braindy-app-staging` + deploy | `firebase hosting:sites:create braindy-app-staging` · `firebase deploy --only hosting:staging` |
| 6 | Auth authorized domain `braindy-app-staging.web.app` (if not automatic) | Console → Authentication → Settings |
| 7 | Service account `braindy-api` · `roles/datastore.user` (condition: database `braindy-app`) · `roles/firebaseauth.viewer` | `gcloud iam service-accounts create braindy-api` + `add-iam-policy-binding --condition=...` |
| 8 | Cloud Run service `braindy-api` (same region, scale to zero, public; the app checks Firebase tokens) | `gcloud run deploy braindy-api --source . --service-account braindy-api@... --set-env-vars ALLOWED_ORIGINS=https://braindy-app-staging.web.app` |
| 9 | Admin profile for Nicolas in `braindy-app` | `npm run set-admin -w server -- nicolas@braindy.co --dry-run`, then without `--dry-run` |

Not in phase 0: app.braindy.co DNS (ask first), KMS (phase 3), Storage (phase 1), any migration.
