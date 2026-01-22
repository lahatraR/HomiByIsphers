# Quick fix script for PHP version mismatch
# Run this from the root of the project

Write-Host "🔧 Fixing PHP Version Mismatch" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Changes summary:" -ForegroundColor Yellow
Write-Host "  1. GitHub Actions: PHP 8.2 → 8.4" -ForegroundColor Green
Write-Host "  2. composer.json: PHP >=8.2 → >=8.4" -ForegroundColor Green
Write-Host "  3. Documentation: PHP_VERSION_FIX.md" -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "📦 Files to commit:" -ForegroundColor Yellow
git status --short .github/workflows/backend-ci.yml homi_backend/composer.json PHP_VERSION_FIX.md

Write-Host ""
$confirm = Read-Host "Commit and push these changes? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "📝 Committing changes..." -ForegroundColor Yellow
    
    git add .github/workflows/backend-ci.yml
    git add homi_backend/composer.json
    git add PHP_VERSION_FIX.md
    
    git commit -m "fix: update PHP version requirement to 8.4

- Update GitHub Actions workflow to use PHP 8.4
- Update composer.json to require PHP >=8.4
- Align all environments with Symfony 8 requirements
- Add comprehensive documentation

Fixes composer dependency installation errors in CI/CD"
    
    Write-Host ""
    Write-Host "🚀 Pushing to repository..." -ForegroundColor Yellow
    git push
    
    Write-Host ""
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Check GitHub Actions status" -ForegroundColor White
    Write-Host "     URL: https://github.com/LahatRar/HomiByIsphers/actions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. The CI/CD pipeline should now pass" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Render will auto-deploy (uses Docker with PHP 8.4)" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  You can manually commit later:" -ForegroundColor Yellow
    Write-Host "git add .github/workflows/backend-ci.yml homi_backend/composer.json PHP_VERSION_FIX.md" -ForegroundColor Gray
    Write-Host 'git commit -m "fix: update PHP version to 8.4"' -ForegroundColor Gray
    Write-Host "git push" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📖 For more details, see: PHP_VERSION_FIX.md" -ForegroundColor Cyan
