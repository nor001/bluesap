Write-Host "🔍 Test de Conexión a Supabase" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Verificando configuración..." -ForegroundColor Yellow

# Verificar variables de entorno
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
Write-Host "🔍 Para probar la conexión manualmente:" -ForegroundColor Cyan
Write-Host "1. Abre herramientas de desarrollador (F12)" -ForegroundColor White
Write-Host "2. Ve a la pestaña Console" -ForegroundColor White
Write-Host "3. Ejecuta este código:" -ForegroundColor White

Write-Host ""
Write-Host "const { createClient } = require('@supabase/supabase-js');" -ForegroundColor Gray
Write-Host "const supabase = createClient('$supabaseUrl', '$supabaseKey');" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "// Probar conexión básica" -ForegroundColor Gray
Write-Host "supabase.from('invited_users').select('*').then(console.log);" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "// Buscar tu email específico" -ForegroundColor Gray
Write-Host "supabase.from('invited_users').select('*').eq('email', 'normantinco@gmail.com').then(console.log);" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 Si ves errores de conexión:" -ForegroundColor Yellow
Write-Host "1. Verifica que las credenciales sean correctas" -ForegroundColor White
Write-Host "2. Verifica que el proyecto Supabase esté activo" -ForegroundColor White
Write-Host "3. Verifica que no haya restricciones de red" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Si la conexión funciona pero no encuentra el email:" -ForegroundColor Yellow
Write-Host "1. Ve a Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Ejecuta: SELECT * FROM invited_users;" -ForegroundColor White
Write-Host "3. Verifica que 'normantinco@gmail.com' esté en la lista" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Si el email está pero sigue el error 403:" -ForegroundColor Yellow
Write-Host "1. Verifica permisos: GRANT SELECT ON invited_users TO anon;" -ForegroundColor White
Write-Host "2. Verifica permisos: GRANT SELECT ON invited_users TO authenticated;" -ForegroundColor White 