# Saves the backend's keys in Secret Manager and connects them to Cloud Run (braindy-api).
# Asks for each value hidden (it never appears on screen or in a file that stays). Press Enter to skip one.
# Run:  powershell -ExecutionPolicy Bypass -File C:\Users\Mark\braindy-app\server\scripts\setup-secrets.ps1
$env:Path = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin;" + $env:Path
$p = 'braindy-brand-guideline'
$sa = 'serviceAccount:braindy-api@braindy-brand-guideline.iam.gserviceaccount.com'
$secrets = [ordered]@{
  'anthropic-api-key'      = @('ANTHROPIC_API_KEY',      'Claude API key (sk-ant-...)')
  'stripe-secret-key'      = @('STRIPE_SECRET_KEY',      'Stripe secret key (sk_live_... or sk_test_...)')
  'stripe-webhook-secret'  = @('STRIPE_WEBHOOK_SECRET',  'Stripe webhook signing secret (whsec_...)')
  'whatsapp-token'         = @('WHATSAPP_TOKEN',         'WhatsApp permanent token (Meta)')
  'whatsapp-phone-id'      = @('WHATSAPP_PHONE_ID',      'WhatsApp phone number ID (Meta)')
  'granola-webhook-secret' = @('GRANOLA_WEBHOOK_SECRET', 'Granola webhook secret (whsec_...)')
}
$existing = @(gcloud.cmd secrets list --project $p --format="value(name)")
$bind = @()
foreach ($name in $secrets.Keys) {
  $envName, $label = $secrets[$name]
  $v = Read-Host -AsSecureString "$label  [Enter = skip]"
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($v)).Trim()
  if (-not $plain) {
    if ($existing -contains $name) { $bind += "$envName=${name}:latest" }
    Write-Output "  skipped $name"; continue
  }
  $f = Join-Path $env:TEMP "braindy-secret.txt"
  [IO.File]::WriteAllText($f, $plain); $plain = $null
  if ($existing -contains $name) { gcloud.cmd secrets versions add $name --data-file=$f --project $p | Out-Null }
  else { gcloud.cmd secrets create $name --data-file=$f --project $p | Out-Null }
  Remove-Item $f -Force
  gcloud.cmd secrets add-iam-policy-binding $name --member $sa --role roles/secretmanager.secretAccessor --project $p | Out-Null
  $bind += "$envName=${name}:latest"
  Write-Output "  saved $name"
}
if ($bind.Count) {
  Write-Output "Connecting to Cloud Run: $(($bind | ForEach-Object { $_.Split('=')[0] }) -join ', ')"
  gcloud.cmd run services update braindy-api --region us-central1 --project $p --update-secrets ($bind -join ',')
}
Write-Output 'Done.'
