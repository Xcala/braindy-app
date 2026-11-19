# One sign-in for a client's site editor: lets braindy-api create the session on the site's own Firebase project
# (siteEditor.ts), so a client who is in Braindy App opens «Hazlo tú» already signed in.
# Per project it grants braindy-api: Firebase Authentication Admin (find or create the user by email) and
# Service Account Token Creator on the project's firebase-adminsdk account (sign the session). Nothing else.
# Then it prints the editorAuth to save on the site's card (braindy_app_link with editorAuth).
# Run:  powershell -ExecutionPolicy Bypass -File C:\Users\Mark\braindy-app\server\scripts\grant-site-editor.ps1
# Add a new site's project to the list and run it again; running it twice changes nothing.
$sa = 'serviceAccount:braindy-api@braindy-brand-guideline.iam.gserviceaccount.com'
$projects = @('quimiolab-web', 'grupo-alternativas', 'legadus-e92eb', 'christine-dyer', 'pequeloop-web', 'jero66-web', 'hacienda-parrilla-web')
foreach ($p in $projects) {
  gcloud projects add-iam-policy-binding $p --member $sa --role roles/firebaseauth.admin --condition=None --quiet *> $null
  if ($LASTEXITCODE -ne 0) { Write-Output "  ERROR  $p (Authentication Admin)"; continue }
  $admin = gcloud iam service-accounts list --project $p --filter="email~firebase-adminsdk" --format="value(email)" | Select-Object -First 1
  if (-not $admin) { Write-Output "  ERROR  $p (no firebase-adminsdk account)"; continue }
  gcloud iam service-accounts add-iam-policy-binding $admin --project $p --member $sa --role roles/iam.serviceAccountTokenCreator --quiet *> $null
  if ($LASTEXITCODE -ne 0) { Write-Output "  ERROR  $p (Token Creator on $admin)"; continue }
  Write-Output "  ok  $p  editorAuth: { projectId: '$p', serviceAccount: '$admin' }"
}
Write-Output 'Done.'
