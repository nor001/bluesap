Write-Host "🔧 Cargando variables de entorno..." -ForegroundColor Green

# Cargar variables de entorno desde .env.local
if (Test-Path ".env.local") {
    Write-Host "✅ Archivo .env.local encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "📋 $key configurado" -ForegroundColor Cyan
            }
        }
    }
} else {
    Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if ($supabaseUrl) {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL: $supabaseUrl" -ForegroundColor Green
} else {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL: No configurado" -ForegroundColor Red
}

if ($supabaseKey) {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Configurado" -ForegroundColor Green
} else {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: No configurado" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow

# Verificar que existe package.json
if (Test-Path "package.json") {
    Write-Host "📦 Proyecto encontrado, iniciando servidor..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "💡 Asegúrate de estar en el directorio correcto" -ForegroundColor Yellow
} 