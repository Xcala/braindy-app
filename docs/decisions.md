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
