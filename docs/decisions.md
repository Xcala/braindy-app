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
