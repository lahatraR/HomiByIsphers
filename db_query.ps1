# Render PostgreSQL Database Query Script
# Usage: .\db_query.ps1

param(
    [string]$Query = "SELECT id, email, role, first_name, last_name FROM public.user;"
)

$Hostname = "dpg-d5jmjbili9vc73bi8rv0-a.oregon-postgres.render.com"
$Username = "homi_user"
$Password = "PoX2rlRS1KhXpc6h9x741WcAlj8hq7aq"
$Database = "homi_db_mzet"

$Env:PGPASSWORD = $Password

Write-Host "🔗 Connecting to Render PostgreSQL..." -ForegroundColor Cyan
Write-Host "Database: $Database" -ForegroundColor Gray

# Execute query
psql -h $Hostname -U $Username -d $Database -c $Query

Write-Host "`n✅ Query executed successfully" -ForegroundColor Green
