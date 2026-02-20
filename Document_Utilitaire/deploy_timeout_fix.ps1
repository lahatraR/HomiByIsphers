# Quick deployment script for API timeout fixes
# Run this from the root of the project

Write-Host "🚀 Deploying API Timeout Fixes" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📦 Files to be committed:" -ForegroundColor Yellow
Write-Host "  - homi_frontend/src/services/api.ts (timeout increased to 60s)" -ForegroundColor Green
Write-Host "  - homi_frontend/src/pages/LoginPage.tsx (loading message)" -ForegroundColor Green
Write-Host "  - homi_backend/src/Controller/HealthController.php (root health endpoint)" -ForegroundColor Green
Write-Host "  - homi_backend/config/packages/security.yaml (root access)" -ForegroundColor Green
Write-Host "  - API_TIMEOUT_FIX.md (documentation)" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Continue with commit and push? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "📝 Committing changes..." -ForegroundColor Yellow
    
    git add homi_frontend/src/services/api.ts
    git add homi_frontend/src/pages/LoginPage.tsx
    git add homi_backend/src/Controller/HealthController.php
    git add homi_backend/config/packages/security.yaml
    git add homi_backend/config/packages/nelmio_cors.yaml
    git add homi_backend/docker/nginx.conf
    git add API_TIMEOUT_FIX.md
    git add deploy_timeout_fix.ps1
    
    git commit -m "fix: resolve API timeout and CORS issues for Render deployment

- Increase frontend API timeout from 10s to 60s for Render cold starts
- Add root health endpoint (/) to backend
- Update security config to allow root access
- Fix CORS double configuration (NGINX + Nelmio conflict)
- Remove CORS headers from nginx.conf
- Update Nelmio CORS path from ^/api/ to ^/
- Improve timeout error messages
- Add user-friendly loading messages
- Add comprehensive troubleshooting documentation

Fixes timeout errors, 404 issues, and CORS policy errors on production."
    
    Write-Host ""
    Write-Host "🚀 Pushing to repository..." -ForegroundColor Yellow
    git push
    
    Write-Host ""
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait for Render to redeploy backend (5-10 minutes)" -ForegroundColor White
    Write-Host "     Dashboard: https://dashboard.render.com/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Wait for GitHub Pages to rebuild frontend (2-5 minutes)" -ForegroundColor White
    Write-Host "     Actions: https://github.com/LahatRar/HomiByIsphers/actions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Test the deployment:" -ForegroundColor White
    Write-Host "     Frontend: https://lahatrar.github.io/HomiByIsphers" -ForegroundColor Gray
    Write-Host "     Backend: https://homi-backend-ybjp.onrender.com/api/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  4. Try logging in (may take 30-60s on first attempt)" -ForegroundColor White
    Write-Host ""
    
    # Test backend health
    Write-Host "🔍 Testing backend health..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://homi-backend-ybjp.onrender.com/api/health" -UseBasicParsing -TimeoutSec 15
        Write-Host "✅ Backend is responding!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Gray
    }
    catch {
        Write-Host "⚠️  Backend check failed (may be redeploying)" -ForegroundColor Yellow
        Write-Host "Wait a few minutes and check manually" -ForegroundColor Gray
    }
    
} else {
    Write-Host ""
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
}

Write-Host ""
Write-Host "📖 For more details, see: API_TIMEOUT_FIX.md" -ForegroundColor Cyan
