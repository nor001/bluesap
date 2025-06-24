Write-Host "🔒 Iniciando servidor de forma segura..." -ForegroundColor Green

# Verificar que existe .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: Archivo .env.local no encontrado" -ForegroundColor Red
    Write-Host "💡 Crea el archivo .env.local con tus credenciales de Supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo .env.local encontrado" -ForegroundColor Green
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Yellow

# Iniciar servidor (Next.js cargará automáticamente .env.local)
npm run dev 