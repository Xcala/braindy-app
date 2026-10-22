# Decisions log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-05 | Phase 0 closed | Login with existing users verified on https://braindy-app-staging.web.app |
| 2026-10-05 | App files go to a **new bucket** for `braindy-app` | The shared bucket `braindy-brand-guideline.firebasestorage.app` and its rules stay untouched |
| 2026-10-05 | The 6 brief users are real clients: **keep all** | Migrate as `members` of their brand |
| 2026-10-05 | Client UI in **ES/EN from day one** | i18n set up in phase 1 (overrides "English only" default in CLAUDE.md) |
| 2026-10-05 | Pre-migration backups | `gs://braindy-backups-283103160183/2026-10-05/{default,brief,orbit}` · 67 / 194 / 149 docs · US multi-region · no auto-delete |
| 2026-10-05 | Brand groups: **Grupo Berrío** (Drive folder "Berrio", each subfolder = brand) contains **Grupo IBMT** (iPark, EquiPark, Park Media y Plaza) | Groups are brand docs with `kind: "group"`; children carry `groupId` |
| 2026-10-05 | Sub Marcas Quimiolab belongs to Quimiolab; all brief users are Quimiolab; gerencia@revistalevel.com.co only in Revista Level | |
| 2026-10-05 | nicolas@xent.co is Nicolas's second account: admin | |
| 2026-10-05 | All migrated brands are current clients (`active`); admin gets an archive/activate toggle | |
| 2026-10-05 | Brand files from Drive must live in the platform (view, download, upload), not links to Drive | Supersedes the "link to Drive only" recommendation |
| 2026-10-05 | Phase 1 migration written: 40 brands (2 groups), 41 assets, 32 context docs, 15 members, 17 users | Second run idempotent |
| 2026-10-05 | More groups: **Restaurantes** (Puerta del Sol, Hacienda Parrilla Bar, Casa en el Aire), **Grupo Alejandra** (Mayo RD, Taxcan), **MEX Group** (Toro Mambo, LNSR) | Renamed: "Case en el Aire" → Casa en el Aire, "PLS" → Principal Learning Strategies |
| 2026-10-05 | "Marcas Personales" in Drive is an organizing folder; each subfolder is a client | 12 older personal brands imported as `archived` |
| 2026-10-05 | Proposals are a separate admin-only module (draft/sent/won/lost, public tracked link, "won → create client") with sending by platform link, Gmail and WhatsApp + open/time tracking | Approved; Gmail send scope to be approved when built |
| 2026-10-05 | Files: private bucket `braindy-app-files`; all downloads/uploads through the backend with 15-min signed URLs | Storage rules cannot read the `braindy-app` database |
| 2026-10-05 | Drive import reads via the `braindy-api` service account on folders shared as Viewer | gcloud's OAuth client is blocked for Drive scopes |
| 2026-10-19 | New brands: Encanto (Restaurantes), Camarón de Sinaloa (MEX Group), Concreto and AR Figures (Grupo Alejandra), Blacky Meals (client) | |
| 2026-10-19 | **Active**: Milohas, Grupo Alternativas, Blacky Meals, CWI, Sanuteam, Tinyroots, Marco Polo, Revista Level, Legadus, Pequeloop, Restaurantes (+ brands), Braindy, Quimiolab, Grupo Berrío (+ brands), Grupo Alejandra (+ brands), Banco Familiar. Everything else archived (MEX Group included) | 36 of 60 active. Status now owned by the app toggle; migration only sets it with `--apply-status` |
| 2026-10-19 | **Multi-brand groups are first-class**: membership in a group grants access to every brand below it (`ancestors` on each brand, rules + tests). Groups need a global view and cross-brand analysis — they are the biggest clients | Group overview + cross-brand search next; cross-brand analysis with the Brains in phase 4 |
| 2026-10-19 | Drive import stage 1 approved: brand-essential folders of active brands (~14k files, 15.4 GB) from the locally mounted Drive | Rest of the files brand by brand later |
| 2026-10-19 | UI follows **"Braindy app · Design v1"** (Claude Design canvas https://claude.ai/artifact/CgvuBqMfZ4TLod6TDxS6ou). Its `bd-app.css` is copied verbatim into `web/src/styles/` (asset URLs localized) | Applied to Login, shell, My brand, My assets, Brands admin. "Brand Brain" name kept as "My brand" until approved |
| 2026-10-19 | Stage 1 Drive import done: 13,972 files · 15.35 GB · 0 errors | |
| 2026-10-20 | Build everything in the design canvas (approved). Waves: A Proposals · B Requests · C Home/Team/Search · D Accesses (KMS) · E WhatsApp · F Onboarding/Report · G Payments | Payments: **Stripe**. WhatsApp Business: yes (Meta account exists). Gmail sending: yes (one-time OAuth setup). Claude API: later, when onboarding/Brains are built |
| 2026-10-20 | Wave A shipped to staging: proposals admin (list, detail, content, files, send by tracked link or WhatsApp, tracking timeline, lost/won → create client) and public page /p/:token with typed signature | Email sending and Stripe payment step pending setup |
| 2026-10-20 | Wave B shipped to staging: Ask for something (taxonomy from brief, routing to a lead Brain, "with Nicolas" level), My requests (board/list), request detail (progress, brief, plan gate, versions, mark on piece, comments with resolve, approve/request changes), compare slider, batch approval; admin delivery (upload version + reason) and "mark published" | Status and stage only change through the backend |
| 2026-10-20 | Brief requests migrated to Quimiolab: 75 requests · 86 versions · 32 comments. brief "completed" → Approved; pending → In production. Files kept at original URLs | Idempotent ids `brief-<id>` |
| 2026-10-20 | Wave C shipped to staging: Home, Team (approval queue, Brain load, members + invites), Cmd+K search, group overview | Members API on Cloud Run rev 00007 |
| 2026-10-20 | Nicolas pre-approved waves D–G and then Drive stage 2a overnight ("las aprobaciones que necesites ya te las otorgo") | Secrets (Meta, Stripe, Claude) are added by Nicolas to Secret Manager; DNS/app.braindy.co still ask first |
| 2026-10-20 | **Wave D resources**: Cloud KMS keyring `braindy-app` (us-central1), key `accesses` (symmetric, 90-day rotation); `braindy-api` SA gets EncrypterDecrypter on that key only. Ciphertext in backend-only `accessSecrets/{brandId__accessId}` with AAD = brand/access path; metadata in `brands/{id}/accesses`; append-only `brands/{id}/accessLog` | Reveal: owners + admin, 30 s, logged. Brains never read. Orbit credentials migrated read-only; setting orbit read-only is left to Nicolas (old repo untouched) |
| 2026-10-20 | Wave D shipped to staging (rev 00008); KMS keyring/key and IAM grant left to Nicolas (permission system blocks Claude) — see docs/setup-pending.md. Orbit migration dry-run: 10 credentials | Writes after KMS exists |
| 2026-10-20 | Wave E shipped: one-time review links (7 days) by WhatsApp; wa.me fallback until Meta token + `delivery_ready` template exist | Approver rights re-checked when deciding |
| 2026-10-20 | Wave F shipped: onboarding (brief → Brand Brain draft → session → sign → live), monthly report. Claude drafts the Brand Brain only when ANTHROPIC_API_KEY is set (backend) | |
| 2026-10-20 | Wave G shipped: Stripe Checkout/portal over REST + signed webhook, transfers confirmed by Nicolas; first payment starts onboarding. Rev 00009 | Needs Stripe keys + webhook in Secret Manager |
| 2026-10-20 | Drive stage 2a started overnight: all files except video of active brands, 76.4 GB to upload | Videos later, brand by brand |
| 2026-10-21 | Hardening shipped (rate limits, security headers, error reporting, CI, daily Firestore backups, App Check behind flags) and first-use tours (Home, Ask, Review) | rev 00011 |
| 2026-10-21 | Phase 4: Brains at work (plan proposals, Marketer report drafts, Researcher competitor watch, learning loop, group analysis), Claude when the key exists, fallback otherwise | Weekly cron needs Cloud Scheduler (setup-pending §5) |
| 2026-10-21 | **Narrative change (Nicolas):** clients prefer a person doing their brand. "Made by NickMark. Powered by his Brains." / "Lo hace NicoMarca. Sus Brains lo aceleran." Nicolas is the author; the Brains are his team | Replaces "Nicolas orchestrates. The Brains execute." App copy, WhatsApp messages and Brain prompts updated; brand doc v06 pending |
| 2026-10-21 | **The four Brains work together on every task:** team meeting on each request (each brings its angle, notes visible to Nicolas), shared team memory (recent work, meetings, insights, learnings), meetings with the client stored per brand (admin) | |
| 2026-10-22 | Granola connected (API key): 40 of 45 meetings of the last 30 days filed as team memory; Daniel's meeting under Grupo Berrío (brands read their groups' meetings) | Webhook pending (Business plan) |
| 2026-10-22 | Drive stage 2b started overnight: videos up to 4 GB of active brands, 278 GB | Files over 4 GB left for later |
