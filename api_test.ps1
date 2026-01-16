# Homi API Test Script
# Tests login, domiciles, tasks, etc.

$BaseUrl = "https://homi-backend-ybjp.onrender.com/api"
$Email = "admin@gmail.com"
$Password = "Admin123!"

Write-Host "🔧 Homi API Test Suite" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# 1. LOGIN TEST
Write-Host "1️⃣ Testing LOGIN..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token

    Write-Host "✅ LOGIN successful!" -ForegroundColor Green
    Write-Host "   User: $Email" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 40))..." -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ LOGIN failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. GET DOMICILES TEST
Write-Host "2️⃣ Testing GET /domiciles..." -ForegroundColor Yellow
try {
    $domicilesResponse = Invoke-WebRequest -Uri "$BaseUrl/domiciles" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing

    $domiciles = $domicilesResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ GET /domiciles successful!" -ForegroundColor Green
    Write-Host "   Count: $($domiciles.Count)" -ForegroundColor Green
    
    if ($domiciles.Count -gt 0) {
        foreach ($d in $domiciles) {
            Write-Host "   - $($d.name) (ID: $($d.id))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ⚠️ No domiciles found" -ForegroundColor Yellow
    }
    Write-Host ""
}
catch {
    Write-Host "❌ GET /domiciles failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure backend is redeployed!" -ForegroundColor Yellow
}

# 3. GET TASKS TEST
Write-Host "3️⃣ Testing GET /tasks..." -ForegroundColor Yellow
try {
    $tasksResponse = Invoke-WebRequest -Uri "$BaseUrl/tasks" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing

    $tasks = $tasksResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ GET /tasks successful!" -ForegroundColor Green
    Write-Host "   Count: $($tasks.Count)" -ForegroundColor Green
    
    if ($tasks.Count -gt 0) {
        foreach ($t in $tasks) {
            Write-Host "   - $($t.title) (Status: $($t.status))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ℹ️ No tasks found" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "❌ GET /tasks failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. HEALTH CHECK
Write-Host "4️⃣ Testing /health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing
    Write-Host "✅ Backend is HEALTHY!" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
}

Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -ForegroundColor Cyan
Write-Host "✅ API Tests Complete!" -ForegroundColor Green
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -NoNewline
Write-Host "=" -ForegroundColor Cyan
