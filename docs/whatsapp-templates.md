# WhatsApp templates (Meta) · Braindy channel

Inside the 24 h window after a client writes, Braindy answers with free messages and buttons. Outside it, Meta only allows **approved templates**. Create them in Dualhook (Templates) or in WhatsApp Manager, category **Utility**, languages **Spanish (`es`)** and **English (`en`)**, with exactly these names and variables.

`{{1}}` brand · `{{2}}` signature (NicoMarca in Spanish, NickMark in English) · `{{3}}` title.

| Name | Body (ES) | Buttons |
|---|---|---|
| `delivery_review` | `{{1}}: {{2}} te envía «{{3}}» para revisar.` | 1 · URL «Ver entrega» `https://braindy-app-staging.web.app/r/{{1}}` · 2 · Quick reply «Aprobar» · 3 · Quick reply «Pedir cambios» |
| `request_approved` | `{{1}}: «{{2}}» quedó aprobado. NicoMarca y su equipo lo dejan listo para publicar.` | 1 · URL «Ver solicitud» `https://braindy-app-staging.web.app/requests/{{1}}` |
| `request_published` | `{{1}}: «{{2}}» ya está publicado.` | 1 · URL «Ver solicitud» `https://braindy-app-staging.web.app/requests/{{1}}` |

In `request_approved` and `request_published`, `{{1}}` = brand and `{{2}}` = title (two variables).

English bodies: `{{1}}: {{2}} sends you "{{3}}" to review.` · `{{1}}: "{{2}}" is approved. NickMark and his team get it ready to publish.` · `{{1}}: "{{2}}" is live.`

When app.braindy.co goes live, change the button URLs to that domain (Meta reviews them again).

The onboarding templates (`onboarding_welcome`, `brand_brain_ready`, `session_confirmed`, `brand_brain_signed`, `system_live`) and the old `delivery_ready` are described in `docs/setup-pending.md`. `delivery_review` replaces `delivery_ready`.

## How the channel works
- A client writes from the number saved in **Settings → Notices → My WhatsApp** (or the brand's notice number): the message becomes a request in their brand. With more than one brand, Braindy asks which one with buttons.
- More messages within 15 minutes, or a reply to a Braindy notice, become a comment on that request. Photos and files go to the brand's Uploads.
- **Approve** / **Ask for changes** on a delivery decide through the review link, only from the number the link was sent to.
- Unknown numbers get a polite reply once a day and wait in **Admin → Team → WhatsApp channel**, where NickMark links them to a person and files the request.
- `STOP` / `BAJA` turns notices off; `START` / `ALTA` turns them back on.
- Secrets (Secret Manager): `whatsapp-token` (Dualhook `dh_live_` key), `whatsapp-phone-id`, `whatsapp-verify-token`, `whatsapp-webhook-key`. With Dualhook the webhook signature is made with Dualhook's app secret, so the secret path segment is the gate; set `whatsapp-app-secret` too if we ever connect a Meta app of our own.
