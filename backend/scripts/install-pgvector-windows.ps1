# Installs pgvector extension files for PostgreSQL 18 on Windows.
# Uses community prebuilt binaries: https://github.com/andreiramani/pgvector_pgsql_windows

param(
    [string]$PgRoot = "C:\Program Files\PostgreSQL\18"
)

$ErrorActionPreference = "Stop"

$downloadUrl = "https://github.com/andreiramani/pgvector_pgsql_windows/releases/download/0.8.5_18.4/vector.v0.8.5-pg18.zip"
$tempDir = Join-Path $env:TEMP "pgvector-install"
$zipPath = Join-Path $tempDir "vector.v0.8.5-pg18.zip"

if (-not (Test-Path $PgRoot)) {
    throw "PostgreSQL not found at $PgRoot"
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

if (-not (Test-Path (Join-Path $tempDir "lib\vector.dll"))) {
    Write-Host "Downloading pgvector for PostgreSQL 18..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
    Write-Host "Extracting archive..."
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
}

$sourceRoot = $tempDir
if (-not (Test-Path (Join-Path $sourceRoot "lib\vector.dll"))) {
    throw "vector.dll not found after extraction"
}

Write-Host "Installing pgvector into $PgRoot ..."

Copy-Item -Path (Join-Path $sourceRoot "lib\vector.dll") -Destination (Join-Path $PgRoot "lib\vector.dll") -Force
Write-Host "  copied lib\vector.dll"

Get-ChildItem (Join-Path $sourceRoot "share\extension") -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $PgRoot "share\extension\$($_.Name)") -Force
    Write-Host "  copied share\extension\$($_.Name)"
}

Write-Host "pgvector files installed."

$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Restarting PostgreSQL service ($($service.Name))..."
    Restart-Service $service.Name
    Write-Host "PostgreSQL service restarted."
} else {
    Write-Host "Restart the PostgreSQL 18 service manually if CREATE EXTENSION fails."
}
