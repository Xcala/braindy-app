# Decisions log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-05 | Phase 0 closed | Login with existing users verified on https://braindy-app-staging.web.app |
| 2026-10-05 | App files go to a **new bucket** for `braindy-app` | The shared bucket `braindy-brand-guideline.firebasestorage.app` and its rules stay untouched |
| 2026-10-05 | The 6 brief users are real clients: **keep all** | Migrate as `members` of their brand |
| 2026-10-05 | Client UI in **ES/EN from day one** | i18n set up in phase 1 (overrides "English only" default in CLAUDE.md) |
| 2026-10-05 | Pre-migration backups | `gs://braindy-backups-283103160183/2026-10-05/{default,brief,orbit}` · 67 / 194 / 149 docs · US multi-region · no auto-delete |
