Write-Host "🔐 Configurador de Certificados SSL" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Solicitar información del certificado
Write-Host ""
Write-Host "📁 ¿Dónde está ubicado tu certificado?" -ForegroundColor Yellow
Write-Host "Ejemplos:" -ForegroundColor Gray
Write-Host "  - C:\certificados\empresa.crt" -ForegroundColor Gray
Write-Host "  - C:\certificados\empresa.pem" -ForegroundColor Gray
Write-Host "  - C:\Users\TuUsuario\Downloads\certificado.crt" -ForegroundColor Gray

$certPath = Read-Host "Ruta del certificado"

# Verificar que el archivo existe
if (Test-Path $certPath) {
    Write-Host "✅ Certificado encontrado: $certPath" -ForegroundColor Green
    
    # Verificar extensión
    $extension = [System.IO.Path]::GetExtension($certPath)
    Write-Host "📄 Formato detectado: $extension" -ForegroundColor Cyan
    
    # Mostrar primeras líneas del certificado
    Write-Host ""
    Write-Host "📋 Contenido del certificado (primeras 3 líneas):" -ForegroundColor Yellow
    Get-Content $certPath | Select-Object -First 3 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Crear archivo .env.local
    Write-Host ""
    Write-Host "🔧 Creando archivo .env.local..." -ForegroundColor Yellow
    
    $envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

# SSL Configuration
NODE_TLS_REJECT_UNAUTHORIZED=0
NODE_EXTRA_CA_CERTS=$certPath

# Proxy Configuration (descomenta si es necesario)
# HTTP_PROXY=http://proxy.empresa.com:8080
# HTTPS_PROXY=http://proxy.empresa.com:8080
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Archivo .env.local creado" -ForegroundColor Green
    
    # Actualizar script de inicio
    Write-Host ""
    Write-Host "🔧 Actualizando script de inicio..." -ForegroundColor Yellow
    
    $scriptContent = @"
Write-Host "🔐 Configurando entorno corporativo..." -ForegroundColor Green

# Configurar variables de entorno para desarrollo local
`$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# Configurar certificado
`$env:NODE_EXTRA_CA_CERTS = "$certPath"

# Configurar proxy (descomenta si es necesario)
# `$env:HTTP_PROXY = "http://proxy.empresa.com:8080"
# `$env:HTTPS_PROXY = "http://proxy.empresa.com:8080"

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
"@
    
    $scriptContent | Out-File -FilePath "start-local.ps1" -Encoding UTF8
    Write-Host "✅ Script start-local.ps1 actualizado" -ForegroundColor Green
    
    # Mostrar instrucciones
    Write-Host ""
    Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Edita .env.local y agrega tus credenciales de Supabase" -ForegroundColor White
    Write-Host "2. Ejecuta: .\start-local.ps1" -ForegroundColor White
    Write-Host "3. Abre: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Para verificar la configuración:" -ForegroundColor Cyan
    Write-Host "   node -e `"console.log('Certificado:', process.env.NODE_EXTRA_CA_CERTS)`"" -ForegroundColor Gray
    
} else {
    Write-Host "❌ Error: No se encontró el certificado en: $certPath" -ForegroundColor Red
    Write-Host "💡 Verifica la ruta y vuelve a intentar" -ForegroundColor Yellow
} 