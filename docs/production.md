# Going live at app.braindy.co (checklist)

Nothing here runs until Nicolas says so (CLAUDE.md: ask before deploying to app.braindy.co or touching DNS).

## Already in place (staging, 2026-10-21)
- Per-IP rate limits on public routes: proposal accept/pay 10 per 10 min, review decision 20 per 10 min, public 120 per min, API 600 per min.
- Security headers on the API (HSTS, nosniff, frame and referrer policies) and on hosting (HSTS, DENY framing, Permissions-Policy, long cache for hashed assets).
- CSP in **report-only** mode.
- Errors from the API and from browsers go to Cloud Error Reporting (services `braindy-api` and `braindy-web`). The web shows a recovery screen instead of a blank page.
- Daily Firestore backups of `braindy-app` with 14-day retention (backup schedule `a947a95e…`).
- CI on GitHub: typecheck, web build and Firestore rules tests on every push.
- App Check is wired but off. The web sends it when `VITE_APPCHECK_SITE_KEY` is set; the API requires it only with `APP_CHECK_ENFORCE=1`.

## To go live
1. **Secrets and keys** from `docs/setup-pending.md`: KMS, Stripe live keys plus the live webhook, Meta templates, Claude.
2. **Hosting:** add `app.braindy.co` as a custom domain on a production hosting site, either a new one or the staging site promoted. Firebase shows the DNS records to add. **This is the DNS step: ask Nicolas first.**
3. **API environment:**
   - `ALLOWED_ORIGINS` must include `https://app.braindy.co`.
   - Set `PUBLIC_BASE_URL=https://app.braindy.co`, so proposal, review and payment links point to the new domain.
4. **Meta templates:** the URL buttons should point to `https://app.braindy.co/r/{{1}}`.
5. **Firebase Auth:** add `app.braindy.co` to Authorized domains.
6. **CSP:**
   - Watch the report-only violations in the browser console on staging for a few days.
   - Then change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `firebase.json`.
7. **App Check:**
   - Create the reCAPTCHA Enterprise key and set `VITE_APPCHECK_SITE_KEY`.
   - Deploy the web.
   - After a day without failures, set `APP_CHECK_ENFORCE=1` on Cloud Run.
8. **Alerts:** in Error Reporting, turn on email notifications for new errors (needs Nicolas's notification channel).
9. **Old apps:** set brief, brands and orbit to read-only, then redirect them to app.braindy.co (sunset).
