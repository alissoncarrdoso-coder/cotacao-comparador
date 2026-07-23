$ErrorActionPreference = "Stop"

Write-Host "Limpando dependencias antigas..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
  Remove-Item "node_modules" -Recurse -Force
}
if (Test-Path "package-lock.json") {
  Remove-Item "package-lock.json" -Force
}

Write-Host "Instalando dependencias da Sprint 2..." -ForegroundColor Cyan
npm install

Write-Host "Validando o build..." -ForegroundColor Cyan
npm run build

Write-Host "Sprint 2 instalada com sucesso." -ForegroundColor Green
