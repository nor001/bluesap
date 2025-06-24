Write-Host "🔍 Diagnóstico de Autenticación" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Verificar variables de entorno
Write-Host ""
Write-Host "📋 Verificando variables de entorno..." -ForegroundColor Yellow

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

# Verificar archivo .env.local
Write-Host ""
Write-Host "📁 Verificando archivo .env.local..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ Archivo .env.local encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local"
    $hasSupabaseUrl = $envContent | Where-Object { $_ -like "*NEXT_PUBLIC_SUPABASE_URL*" }
    $hasSupabaseKey = $envContent | Where-Object { $_ -like "*NEXT_PUBLIC_SUPABASE_ANON_KEY*" }
    
    if ($hasSupabaseUrl) {
        Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL en .env.local" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL no encontrado en .env.local" -ForegroundColor Red
    }
    
    if ($hasSupabaseKey) {
        Write-Host "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no encontrado en .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
}

# Verificar configuración SSL
Write-Host ""
Write-Host "🔐 Verificando configuración SSL..." -ForegroundColor Yellow

$sslReject = $env:NODE_TLS_REJECT_UNAUTHORIZED
$sslCerts = $env:NODE_EXTRA_CA_CERTS

if ($sslReject -eq "0") {
    Write-Host "✅ NODE_TLS_REJECT_UNAUTHORIZED=0 configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️ NODE_TLS_REJECT_UNAUTHORIZED no configurado" -ForegroundColor Yellow
}

if ($sslCerts) {
    Write-Host "✅ NODE_EXTRA_CA_CERTS: $sslCerts" -ForegroundColor Green
    if (Test-Path $sslCerts) {
        Write-Host "✅ Certificado encontrado en la ruta especificada" -ForegroundColor Green
    } else {
        Write-Host "❌ Certificado no encontrado en la ruta especificada" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ NODE_EXTRA_CA_CERTS no configurado" -ForegroundColor Yellow
}

# Mostrar instrucciones de solución
Write-Host ""
Write-Host "🎯 Soluciones Recomendadas:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host ""
    Write-Host "1️⃣ Configurar credenciales de Supabase:" -ForegroundColor Yellow
    Write-Host "   - Ve a https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "   - Selecciona tu proyecto" -ForegroundColor White
    Write-Host "   - Ve a Settings → API" -ForegroundColor White
    Write-Host "   - Copia Project URL y anon public key" -ForegroundColor White
    Write-Host "   - Agrega al archivo .env.local:" -ForegroundColor White
    Write-Host ""
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co" -ForegroundColor Gray
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2️⃣ Verificar tabla invited_users en Supabase:" -ForegroundColor Yellow
Write-Host "   - Ve a SQL Editor en Supabase" -ForegroundColor White
Write-Host "   - Ejecuta: SELECT * FROM invited_users;" -ForegroundColor White
Write-Host "   - Verifica que tu email esté en la lista" -ForegroundColor White

Write-Host ""
Write-Host "3️⃣ Verificar configuración de OAuth:" -ForegroundColor Yellow
Write-Host "   - En Supabase: Authentication → Settings" -ForegroundColor White
Write-Host "   - Site URL: http://localhost:3000" -ForegroundColor White
Write-Host "   - Redirect URLs: http://localhost:3000/auth/callback" -ForegroundColor White

Write-Host ""
Write-Host "4️⃣ Reiniciar servidor después de cambios:" -ForegroundColor Yellow
Write-Host "   .\start-local.ps1" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Para más diagnóstico:" -ForegroundColor Cyan
Write-Host "   - Abre herramientas de desarrollador (F12)" -ForegroundColor White
Write-Host "   - Ve a la pestaña Console" -ForegroundColor White
Write-Host "   - Busca errores relacionados con Supabase" -ForegroundColor White 