Write-Host "🔧 Configurador Rápido de Variables de Entorno" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Para obtener tus credenciales de Supabase:" -ForegroundColor Yellow
Write-Host "1. Ve a https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecciona tu proyecto" -ForegroundColor White
Write-Host "3. Ve a Settings → API" -ForegroundColor White
Write-Host "4. Copia Project URL y anon public key" -ForegroundColor White

Write-Host ""
Write-Host "🔑 Ingresa tus credenciales:" -ForegroundColor Cyan

$supabaseUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL (ej: https://abc123.supabase.co)"
$supabaseKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY"

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: Las credenciales no pueden estar vacías" -ForegroundColor Red
    exit 1
}

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey

# SSL Configuration
NODE_TLS_REJECT_UNAUTHORIZED=0

# Certificado SSL (descomenta y ajusta la ruta según tu certificado)
# NODE_EXTRA_CA_CERTS=C:\path\to\tu-certificado.crt

# Proxy Configuration (descomenta si es necesario)
# HTTP_PROXY=http://proxy.empresa.com:8080
# HTTPS_PROXY=http://proxy.empresa.com:8080
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Archivo .env.local creado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Reinicia el servidor: .\start-local.ps1" -ForegroundColor White
Write-Host "2. Prueba el login con Google" -ForegroundColor White
Write-Host "3. Verifica que no aparezca el error 403" -ForegroundColor White 