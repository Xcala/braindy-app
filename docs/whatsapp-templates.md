# WhatsApp templates (Meta) · Braindy channel

Inside the 24 h window after a client writes, Braindy answers with free messages and buttons. Outside it, Meta only allows **approved templates**. Create them in Dualhook (Templates) or in WhatsApp Manager, category **Utility**, languages **Spanish (`es`)** and **English (`en`)**, with exactly these names and variables.

`{{1}}` brand · `{{2}}` signature (NicoMarca in Spanish, NickMark in English) · `{{3}}` title.

| Name | Body (ES) | Buttons |
|---|---|---|
| `delivery_review` | `{{1}}: {{2}} te envía «{{3}}» para revisar.` | 1 · URL «Ver entrega» `https://braindy-app-staging.web.app/r/{{1}}` · 2 · Quick reply «Aprobar» · 3 · Quick reply «Pedir cambios» |
| `request_approved` | `{{1}}: «{{2}}» quedó aprobado. NicoMarca y su equipo lo dejan listo para publicar.` | 1 · URL «Ver solicitud» `https://braindy-app-staging.web.app/requests/{{1}}` |
| `request_published` | `{{1}}: «{{2}}» ya está publicado.` | 1 · URL «Ver solicitud» `https://braindy-app-staging.web.app/requests/{{1}}` |
| `request_due_tomorrow` | `{{1}}: mañana se entrega «{{2}}». NicoMarca y su equipo lo tienen en curso.` | 1 · URL «Ver solicitudes» `https://app.braindy.co/requests` |

In `request_approved`, `request_published` and `request_due_tomorrow`, `{{1}}` = brand and `{{2}}` = title (two variables).

English bodies: `{{1}}: {{2}} sends you "{{3}}" to review.` · `{{1}}: "{{2}}" is approved. NickMark and his team get it ready to publish.` · `{{1}}: "{{2}}" is live.` · `{{1}}: "{{2}}" is due tomorrow. NickMark and his team have it in progress.`

When app.braindy.co goes live, change the button URLs to that domain (Meta reviews them again).

Contract templates (onboarding step 1), one variable `{{1}}` = brand:

| Name | Body (ES) | Body (EN) | Button |
|---|---|---|---|
| `contract_ready` | `{{1}}: su contrato con NicoMarca está listo para firmar. Lo firma el representante legal en Braindy.` | `{{1}}: your contract with NickMark is ready to sign. The legal representative signs it in Braindy.` | URL «Firmar» `https://app.braindy.co/onboarding` |
| `contract_signed` | `{{1}}: el contrato quedó firmado por las dos partes. El PDF está en Mis archivos. Arrancamos.` | `{{1}}: the contract is signed by both parties. The PDF is in My files. We start.` | URL «Ver arranque» `https://app.braindy.co/onboarding` |

The onboarding templates (`onboarding_welcome`, `brand_brain_ready`, `session_confirmed`, `brand_brain_signed`, `system_live`) and the old `delivery_ready` are described in `docs/setup-pending.md`. `delivery_review` replaces `delivery_ready`.

## How the channel works
- A client writes from the number saved in **Settings → Notices → My WhatsApp** (or the brand's notice number): the message becomes a request in their brand. With more than one brand, Braindy asks which one with buttons.
- More messages within 15 minutes, or a reply to a Braindy notice, become a comment on that request. Photos and files go to the brand's Uploads.
- **Approve** / **Ask for changes** on a delivery decide through the review link, only from the number the link was sent to.
- Unknown numbers get a polite reply once a day and wait in **Admin → Team → WhatsApp channel**, where NickMark links them to a person and files the request.
- `STOP` / `BAJA` turns notices off; `START` / `ALTA` turns them back on.
- Secrets (Secret Manager): `whatsapp-token` (Dualhook `dh_live_` key), `whatsapp-phone-id`, `whatsapp-verify-token`, `whatsapp-webhook-key`. With Dualhook the webhook signature is made with Dualhook's app secret, so the secret path segment is the gate; set `whatsapp-app-secret` too if we ever connect a Meta app of our own.

## Due tomorrow (daily)
Every day at 08:00 (Bogotá) Cloud Scheduler calls `/cron/daily`: each request in production whose due date is tomorrow sends `request_due_tomorrow` to the brand's notice number, once per due date. Without the template, the notice waits with a wa.me link. The list of the day is in Firestore `admin/dueReminders/days/{day}`.

## Sign-in by WhatsApp (`access_link`)

Sent from Brands › Manage › People when NickMark taps **WhatsApp** on a person (or invites someone with a mobile number). One variable `{{1}}` = brand; the button carries the one-time token. Category **Utility** (if Meta asks for **Authentication**, keep Utility: this is an invitation link, not a code).

| Name | Body (ES) | Buttons |
|---|---|---|
| `access_link` | `Hola. NicoMarca te invitó a {{1}} en Braindy, donde ves y apruebas todo el trabajo de tu marca. Entra con el botón, sin contraseña. El enlace sirve una vez y vence en 7 días. Para volver a entrar, escribe «Quiero entrar».` | 1 · URL «Entrar a Braindy» `https://app.braindy.co/entrar/{{1}}` |

English body: `Hi. NickMark invited you to {{1}} on Braindy, where you see and approve all the work on your brand. Sign in with the button, no password. The link works once and expires in 7 days. To come back, write "Sign in".` · Button «Sign in to Braindy».

Until it is approved: inside the 24 h window the link goes as a free message; otherwise the app opens NickMark's own WhatsApp with the message ready. A client who writes «Quiero entrar» / «Sign in» to the Braindy number gets a 15-minute link back (no template needed: they wrote first). Only numbers linked to a client get it; admins never sign in by link.
