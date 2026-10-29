# Pending setup (Nicolas runs these)

The code for waves D–G is deployed to staging. Each feature below already works in a fallback mode and switches to its full mode once its key or resource exists. Claude does not create keys or IAM grants, and never handles secret values.

Run the commands in PowerShell with gcloud on the PATH. If PowerShell blocks scripts ("la ejecución de scripts está deshabilitada"), type `gcloud.cmd` and `npx.cmd` instead of `gcloud` and `npx`. Secrets are written through a temporary file so PowerShell does not add a line break:

```powershell
$env:Path = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin;" + $env:Path
$p = "braindy-brand-guideline"
$sa = "serviceAccount:braindy-api@braindy-brand-guideline.iam.gserviceaccount.com"
```

## 1 · Accesses: Cloud KMS (wave D) — DONE 2026-10-28 (key active, API can encrypt; first access saved on staging)

Until this is done, adding or revealing an access on staging returns an error.

```powershell
gcloud services enable cloudkms.googleapis.com --project $p
gcloud kms keyrings create braindy-app --location us-central1 --project $p
gcloud kms keys create accesses --keyring braindy-app --location us-central1 --purpose encryption --rotation-period 90d --next-rotation-time 2027-01-18T00:00:00Z --project $p
gcloud kms keys add-iam-policy-binding accesses --keyring braindy-app --location us-central1 --project $p --member $sa --role roles/cloudkms.cryptoKeyEncrypterDecrypter
# To run the orbit migration from your machine (encrypt only, no decrypt):
gcloud kms keys add-iam-policy-binding accesses --keyring braindy-app --location us-central1 --project $p --member "user:nicolas@xent.co" --role roles/cloudkms.cryptoKeyEncrypter
```

Then migrate the 10 orbit credentials. The dry run was already done: 6 for Hacienda Parrilla Bar and 4 for Quimiolab.

```powershell
cd C:\Users\Mark\braindy-app; $env:GOOGLE_CLOUD_QUOTA_PROJECT=$p; npm run migrate:accesses -w server -- --write
```

After checking them in the app, set orbit to read-only yourself (Claude does not touch the old repos).

## 2 · Secrets for Cloud Run (WhatsApp, Claude, Stripe)

Create each secret with your value. The value is read from the prompt and is never written in a file. Then grant the API's service account access to it:

```powershell
foreach ($s in "whatsapp-token","whatsapp-phone-id","anthropic-api-key","stripe-secret-key","stripe-webhook-secret") {
  $v = Read-Host -AsSecureString "Value for $s"
  $f = "$env:TEMPsecret.txt"; [IO.File]::WriteAllText($f, [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($v)))
  gcloud secrets create $s --data-file=$f --project $p; Remove-Item $f
  gcloud secrets add-iam-policy-binding $s --member $sa --role roles/secretmanager.secretAccessor --project $p
}
gcloud run services update braindy-api --region us-central1 --project $p --update-secrets "WHATSAPP_TOKEN=whatsapp-token:latest,WHATSAPP_PHONE_ID=whatsapp-phone-id:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest"
```

You can do them one at a time. A missing secret only leaves its feature in fallback mode.

### WhatsApp (wave E)
- **Where the values come from:** Meta Business → WhatsApp → API setup. You need a permanent system-user token and the phone number ID.
- **Template to create and get approved:** `delivery_ready`, in Spanish (`es`) and English (`en`).
  - Body with 3 variables: `{{1}}` brand, `{{2}}` signature (NicoMarca in Spanish, NickMark in English), `{{3}}` title. Example text: "{{1}}: {{2}} te envía «{{3}}» para revisar. Apruébalo sin iniciar sesión."
  - One URL button: `https://braindy-app-staging.web.app/r/{{1}}` (use the app.braindy.co domain when it goes live).
- **Onboarding templates (wave H), same idea, Spanish and English, `{{1}}` = brand:**
  - `onboarding_welcome` (day 0)
  - `brand_brain_ready` (day 1)
  - `session_confirmed` (day 2; `{{2}}` = date and time)
  - `brand_brain_signed` (day 2)
  - `system_live` (day 11)
- **Without it:** after each delivery the panel shows a ready "Abrir WhatsApp" link, and the onboarding notices wait in Admin → Onboarding with a send button.

### Claude (wave F)
- **What it's for:** with the key, the Researcher writes the Brand Brain draft from the brief.
- **Without it:** the draft is assembled from the answers, and you complete it before signing.
- **Model:** `claude-opus-5-5`. You can change it with the `ANTHROPIC_MODEL` variable.

### Stripe (wave G)
- **Keys:** use test-mode keys first (`sk_test_…`).
- **Webhook:** in Stripe → Developers → Webhooks → Add endpoint, enter `https://braindy-api-283103160183.us-central1.run.app/webhooks/stripe`, then copy the signing secret (`whsec_…`) into the secret above. Events to select:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- **Customer portal:** turn it on in Stripe → Settings → Billing → Customer portal.
- **Without the keys:** clients pay by transfer and you confirm it in Admin → Facturación.

## 3 · Gmail sending for proposals (wave A, pending)
This one needs a one-time OAuth consent with nicolas@braindy.co. Ask Claude to walk you through it when you want to turn it on.

## 4 · App Check and error alerts (optional now, required before production)
- **App Check:** create a reCAPTCHA Enterprise key for the web (Firebase console → App Check → Web app → reCAPTCHA Enterprise). Send Claude the site key (it is public). The steps to turn it on are in `docs/production.md`.
- **Alerts:** Error Reporting → Turn on notifications → choose your email. Errors from the API and from browsers already arrive there.

## 5 · Weekly Brain work (competitor watch)
The Researcher can already check competitors on demand (Admin → Onboarding → "Check competitors now"). To run it every Monday by itself, create a Cloud Scheduler job that calls the API with an OIDC token:

```powershell
$url = "https://braindy-api-283103160183.us-central1.run.app"
gcloud services enable cloudscheduler.googleapis.com --project $p
gcloud scheduler jobs create http braindy-weekly --location us-central1 --project $p --schedule "0 8 * * 1" --time-zone "America/Bogota" --uri "$url/cron/weekly" --http-method POST --oidc-service-account-email braindy-api@braindy-brand-guideline.iam.gserviceaccount.com --oidc-token-audience $url
gcloud run services update braindy-api --region us-central1 --project $p --update-env-vars "CRON_AUDIENCE=$url,CRON_SA=braindy-api@braindy-brand-guideline.iam.gserviceaccount.com"
```
If Scheduler says it cannot act as the service account, grant its service agent `roles/iam.serviceAccountTokenCreator` on `braindy-api@…`.

## 6 · Granola → team memory
1. **API key (enables "Sync last 30 days" in Team):** Granola → Settings → Connectors → API → **Personal API keys** → create one (starts with `grn_`). Save it as the secret `granola-api-key`.
2. **Webhook (every new note arrives by itself):** Granola → Connectors → **Webhooks** → add endpoint `https://braindy-api-283103160183.us-central1.run.app/webhooks/granola`, events `note.generated` and `note.edited`. Copy the signing secret (`whsec_…`, shown once) as the secret `granola-webhook-secret`. Webhooks need a Granola Business or Enterprise plan; without it, use the Sync button.
3. Mount both on Cloud Run:
```powershell
foreach ($s in "granola-api-key","granola-webhook-secret") { $v = Read-Host -AsSecureString "Value for $s"; $f = "$env:TEMPsecret.txt"; [IO.File]::WriteAllText($f, [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($v))); gcloud secrets create $s --data-file=$f --project $p; Remove-Item $f; gcloud secrets add-iam-policy-binding $s --member $sa --role roles/secretmanager.secretAccessor --project $p }
gcloud run services update braindy-api --region us-central1 --project $p --update-secrets "GRANOLA_API_KEY=granola-api-key:latest,GRANOLA_WEBHOOK_SECRET=granola-webhook-secret:latest"
```
Notes are filed by participant email domain or brand name in the title; the rest wait in Team → Granola meetings. Assigning one teaches its domains for next time.

## 7 · Before app.braindy.co
See `docs/production.md`.
DNS and the production deploy are only done after asking you (CLAUDE.md).
