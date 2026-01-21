# Script de Vérification Pré-Déploiement
# Exécuter: .\check_deployment.ps1

Write-Host "`n=== Vérification de Configuration de Déploiement ===" -ForegroundColor Cyan

# Vérifier Backend .env
Write-Host "`n[1/6] Backend .env..." -ForegroundColor Yellow
$backendEnv = Get-Content "homi_backend\.env" -Raw
if ($backendEnv -match "FRONTEND_URL=https://lahatrar\.github\.io") {
    Write-Host "  ✓ FRONTEND_URL configuré pour production" -ForegroundColor Green
} else {
    Write-Host "  ✗ FRONTEND_URL n'est pas configuré pour production" -ForegroundColor Red
}

if ($backendEnv -match "MAILER_DSN=smtp://") {
    Write-Host "  ✓ MAILER_DSN configuré" -ForegroundColor Green
} else {
    Write-Host "  ✗ MAILER_DSN manquant" -ForegroundColor Red
}

if ($backendEnv -match "EMAIL_VERIFICATION_TOKEN_EXPIRATION=86400") {
    Write-Host "  ✓ EMAIL_VERIFICATION_TOKEN_EXPIRATION configuré (24h)" -ForegroundColor Green
} else {
    Write-Host "  ✗ EMAIL_VERIFICATION_TOKEN_EXPIRATION manquant ou incorrect" -ForegroundColor Red
}

# Vérifier Frontend .env.production
Write-Host "`n[2/6] Frontend .env.production..." -ForegroundColor Yellow
$frontendEnvProd = Get-Content "homi_frontend\.env.production" -Raw
if ($frontendEnvProd -match "VITE_API_BASE_URL=https://homi-backend-ybjp\.onrender\.com/api") {
    Write-Host "  ✓ VITE_API_BASE_URL configuré pour Render" -ForegroundColor Green
} else {
    Write-Host "  ✗ VITE_API_BASE_URL n'est pas configuré correctement" -ForegroundColor Red
}

# Vérifier render.yaml
Write-Host "`n[3/6] render.yaml (racine)..." -ForegroundColor Yellow
$renderYaml = Get-Content "render.yaml" -Raw
if ($renderYaml -match "FRONTEND_URL") {
    Write-Host "  ✓ FRONTEND_URL présent dans render.yaml" -ForegroundColor Green
} else {
    Write-Host "  ✗ FRONTEND_URL manquant dans render.yaml" -ForegroundColor Red
}

if ($renderYaml -match "MAILER_DSN") {
    Write-Host "  ✓ MAILER_DSN présent dans render.yaml" -ForegroundColor Green
} else {
    Write-Host "  ✗ MAILER_DSN manquant dans render.yaml" -ForegroundColor Red
}

if ($renderYaml -match "healthCheckPath: /api/health") {
    Write-Host "  ✓ healthCheckPath configuré" -ForegroundColor Green
} else {
    Write-Host "  ✗ healthCheckPath incorrect" -ForegroundColor Red
}

# Vérifier migrations
Write-Host "`n[4/6] Migrations..." -ForegroundColor Yellow
$migrations = Get-ChildItem "homi_backend\migrations" -Filter "*.php" | Where-Object { $_.Name -ne ".gitignore" }
Write-Host "  ✓ $($migrations.Count) migrations trouvées" -ForegroundColor Green
if ($migrations.Name -contains "Version20260121143000.php") {
    Write-Host "  ✓ Migration email verification présente" -ForegroundColor Green
} else {
    Write-Host "  ✗ Migration Version20260121143000.php manquante!" -ForegroundColor Red
}

# Vérifier vite.config.ts
Write-Host "`n[5/6] vite.config.ts..." -ForegroundColor Yellow
$viteConfig = Get-Content "homi_frontend\vite.config.ts" -Raw
if ($viteConfig -match "base: '/HomiByIsphers/'") {
    Write-Host "  OK Base path GitHub Pages configure" -ForegroundColor Green
} else {
    Write-Host "  X Base path GitHub Pages manquant" -ForegroundColor Red
}

# Vérifier workflow GitHub Actions
Write-Host "`n[6/6] GitHub Actions workflow..." -ForegroundColor Yellow
if (Test-Path ".github\workflows\deploy.yml") {
    $workflow = Get-Content ".github\workflows\deploy.yml" -Raw
    if ($workflow -match "VITE_API_BASE_URL: https://homi-backend-ybjp.onrender.com/api") {
        Write-Host "  ✓ Workflow configuré avec l'URL Render" -ForegroundColor Green
    } else {
        Write-Host "  ✗ VITE_API_BASE_URL manquant dans workflow" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ deploy.yml manquant" -ForegroundColor Red
}

# Résumé
Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
Write-Host "Backend API: https://homi-backend-ybjp.onrender.com/api" -ForegroundColor White
Write-Host "Frontend: https://lahatrar.github.io/HomiByIsphers/" -ForegroundColor White
Write-Host "`nSi toutes les vérifications sont ✓, vous pouvez:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'feat: Configuration déploiement production'" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
