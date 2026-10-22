# Drive stage 2b (videos) that survives the Workspace reauth policy: waits until the local Google
# credentials work, runs the import, and when they expire (exit 3) waits again and resumes. Up to 24 hours.
$env:Path = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin;" + $env:Path
$env:GOOGLE_CLOUD_QUOTA_PROJECT = 'braindy-brand-guideline'
Set-Location (Join-Path $PSScriptRoot '..\..')
$deadline = (Get-Date).AddHours(24)
while ((Get-Date) -lt $deadline) {
  $token = gcloud.cmd auth application-default print-access-token 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $token) {
    Write-Output "$(Get-Date -Format HH:mm) waiting for: gcloud auth application-default login"
    Start-Sleep 120
    continue
  }
  Write-Output "$(Get-Date -Format HH:mm) credentials OK, importing videos"
  npx tsx scripts/drive/import.ts --stage all --only-video --max-gb 4 --concurrency 4
  if ($LASTEXITCODE -eq 0) { Write-Output "$(Get-Date -Format HH:mm) DONE"; exit 0 }
  Write-Output "$(Get-Date -Format HH:mm) import stopped (exit $LASTEXITCODE), will resume"
  Start-Sleep 60
}
Write-Output 'Gave up after 24 hours'
