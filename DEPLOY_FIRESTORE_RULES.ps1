$ErrorActionPreference = 'Stop'

Write-Host 'Awa Stock - deploying Firestore security rules to project awa-stock...' -ForegroundColor Cyan
npx firebase-tools deploy --only firestore:rules --project awa-stock
if ($LASTEXITCODE -ne 0) {
  throw "Firestore rules deployment failed with exit code $LASTEXITCODE."
}
Write-Host 'Firestore rules deployed successfully.' -ForegroundColor Green
