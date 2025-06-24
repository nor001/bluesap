Write-Host "🔐 Configurando entorno corporativo..." -ForegroundColor Green

# Configurar variables de entorno para desarrollo local
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# Configurar certificado (descomenta y ajusta la ruta según tu certificado)
# $env:NODE_EXTRA_CA_CERTS = "C:\path\to\tu-certificado.crt"

# Configurar proxy (descomenta y ajusta según tu empresa)
# $env:HTTP_PROXY = "http://proxy.empresa.com:8080"
# $env:HTTPS_PROXY = "http://proxy.empresa.com:8080"

Write-Host "✅ Entorno configurado" -ForegroundColor Green
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow

# Verificar que existe package.json
if (Test-Path "package.json") {
    Write-Host "📦 Proyecto encontrado, iniciando servidor..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "💡 Asegúrate de estar en el directorio correcto" -ForegroundColor Yellow
} 