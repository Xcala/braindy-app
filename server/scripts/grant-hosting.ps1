# Lets braindy-api pause and resume each client's website (Firebase Hosting Admin on the client's project).
# Needed for the hosting payment rule: pause on day 15 without payment, back on payment (sitePause.ts).
# Run:  powershell -ExecutionPolicy Bypass -File C:\Users\Mark\braindy-app\server\scripts\grant-hosting.ps1
# Add a new client's project to the list and run it again; running it twice changes nothing.
$sa = 'serviceAccount:braindy-api@braindy-brand-guideline.iam.gserviceaccount.com'
$projects = @(
  'pequeloop-web', 'sanuteam-web', 'quimiolab-web', 'revista-level', 'community-workforce-institute', 'ariza-granadillo',
  'grupo-alternativas', 'legadus-e92eb', 'christine-dyer', 'tinyroots', 'puerta-del-sol-app', 'ruta-equipark', 'taxcan-us'
)
foreach ($p in $projects) {
  gcloud projects add-iam-policy-binding $p --member $sa --role roles/firebasehosting.admin --condition=None --quiet *> $null
  if ($LASTEXITCODE -eq 0) { Write-Output "  ok  $p" } else { Write-Output "  ERROR  $p" }
}
Write-Output 'Done.'
