# CLAUDE.md · Braindy platform (app.braindy.co)

Read this first in every session. Full product spec: `docs/braindy-app-spec-v1.md` (copy of the project doc `plataforma/braindy-app-spec-v1.md`).

## What we are building
One platform, called simply **Braindy**, at **app.braindy.co**. It replaces three apps that work but are disconnected:
- brief.braindy.co (requests: works, in production)
- brands.braindy.co (clients, logos, brand books, HTML documents: the most robust)
- orbit.braindy.co (credentials/access, intake chat, deliverable versions)

Do NOT name anything Orbit, Artemis, Fleet, Galaxy or Mission. No gamified metrics.

## The team model (product concept)
- **Nicolas** = Orchestrator (strategy, direction, approvals). Only human admin.
- **4 Brain Agents** do and explain the work:
  | Brain | Verb | Color | Specialties |
  |---|---|---|---|
  | Researcher | Research | #F5B301 | Research, Analytics |
  | Marketer | Communicate | #8B5CF6 | Marketing, Publishing, Metrics |
  | Creator | Create | #06B6D4 | Naming, Design, Motion |
  | Builder | Build | #2A7FFF | Web, Apps, Automations, AI Agents |
- Line: "Nicolas orchestrates. The Brains execute." All UI copy in English (client-facing Spanish later via i18n).
- Brain avatars (3D + emoji + 5 s loops) are status indicators and signatures, not chat companions. Asset URLs: `docs/brain-agents-assets.md`.

## Golden rules
1. **Never break the old apps.** They keep running until each module is replaced. Never write to the old databases. Migration scripts only READ from them.
2. **Same Firebase project** (`braindy-brand-guideline`), same Auth users. New Firestore database: `braindy-app`. Do not touch database `(default)` beyond reads: it also hosts the Namén Vargas website (team_members, page_content, blog_posts, testimonials, inquiries).
3. **No AI calls from the browser.** All model calls go through a backend (Cloud Run or Cloud Functions). No API keys in the bundle.
4. **Client credentials are always encrypted** (Cloud KMS or envelope encryption), never stored or logged in plain text, only decrypted server-side on explicit reveal by an authorized user, and every reveal is logged.
5. **One brand = one ID.** Everything hangs from `brands/{brandId}`. Clients only see their own brand(s).
6. Small components. No file over ~400 lines. (The old BrandBuilderProApp.tsx had 10.8k lines; do not repeat that.)
7. Security rules are written and tested (emulator) before any feature that reads or writes data ships.

## Stack
React 19 + TypeScript + Vite + Tailwind v4, react-router 7, Firebase 12 (Auth, Firestore, Storage), backend on Cloud Run (Node/TS). Brand typeface: Red Hat Display (300/900 contrast, no italics). The "ai" inside Br**ai**n / Br**ai**ndy is set in 900 lowercase only in headlines, lockups and signatures.

## Old sources (read-only references, never import files wholesale)
- Repos (GitHub org Xcala): `Brief-Braindy`, `Brands-Braindy`, `braindy-orbit-` (also at ~/braindy-orbit). Built in Google AI Studio.
- Firestore databases: orbit = `ai-studio-f47795fa…`, brief = `ai-studio-5a30c0b0-483a-4f53-a864-8d0cc7128673`, brands = `(default)`.
- Rescue as models/ideas: DesignRequest/Step, Deliverable with versions + approval, BrandVoice, ColorSwatch, TypographySpec, Credential, `categories.ts` (request taxonomy), Artemis intake prompt (12 questions), firestore.rules role pattern, VisualFeedbackCanvas (Konva annotations), analyzeCampaignScreenshot.

## Working agreements
- Work in phases (see spec). Finish and verify one phase before starting the next.
- Before migrating: export backups of the three databases.
- Every migration script is idempotent, has a `--dry-run`, and prints a report (counts, merged duplicates, skipped records).
- Commit small, descriptive commits. Ask Nicolas before deploying to app.braindy.co or touching DNS.
- When a product decision is unclear, stop and ask; product decisions live in the Cowork project "Braindy".
