Write-Host "🔧 Configurador de Variables de Entorno" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Para configurar Supabase necesitas:" -ForegroundColor Yellow
Write-Host "1. Ir a https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Seleccionar tu proyecto" -ForegroundColor White
Write-Host "3. Ir a Settings → API" -ForegroundColor White
Write-Host "4. Copiar Project URL y anon public key" -ForegroundColor White

Write-Host ""
Write-Host "🔑 Ingresa tus credenciales de Supabase:" -ForegroundColor Cyan

$supabaseUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL (ej: https://abc123.supabase.co)"
$supabaseKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Validar que no estén vacías
if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: Las credenciales no pueden estar vacías" -ForegroundColor Red
    exit 1
}

# Crear contenido del archivo .env.local
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

# Escribir archivo .env.local
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Archivo .env.local creado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que las credenciales sean correctas" -ForegroundColor White
Write-Host "2. Crea la tabla invited_users en Supabase" -ForegroundColor White
Write-Host "3. Agrega tu email a la tabla" -ForegroundColor White
Write-Host "4. Ejecuta: .\start-local.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para crear la tabla invited_users, ejecuta en Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "CREATE TABLE IF NOT EXISTS invited_users (" -ForegroundColor Gray
Write-Host "  id SERIAL PRIMARY KEY," -ForegroundColor Gray
Write-Host "  email TEXT UNIQUE NOT NULL," -ForegroundColor Gray
Write-Host "  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()" -ForegroundColor Gray
Write-Host ");" -ForegroundColor Gray
Write-Host ""
Write-Host "INSERT INTO invited_users (email) VALUES ('tu-email@empresa.com');" -ForegroundColor Gray 