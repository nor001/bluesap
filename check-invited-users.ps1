Write-Host "🔍 Verificador de Tabla invited_users" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Para verificar la tabla invited_users necesitas:" -ForegroundColor Yellow
Write-Host "1. Ir a https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Seleccionar tu proyecto" -ForegroundColor White
Write-Host "3. Ir a SQL Editor" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Ejecuta estos comandos SQL en Supabase:" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Verificar si la tabla existe:" -ForegroundColor Yellow
Write-Host "SELECT EXISTS (" -ForegroundColor Gray
Write-Host "  SELECT FROM information_schema.tables" -ForegroundColor Gray
Write-Host "  WHERE table_name = 'invited_users'" -ForegroundColor Gray
Write-Host ");" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Verificar contenido de la tabla:" -ForegroundColor Yellow
Write-Host "SELECT * FROM invited_users;" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Verificar permisos de la tabla:" -ForegroundColor Yellow
Write-Host "SELECT grantee, privilege_type" -ForegroundColor Gray
Write-Host "FROM information_schema.role_table_grants" -ForegroundColor Gray
Write-Host "WHERE table_name = 'invited_users';" -ForegroundColor Gray

Write-Host ""
Write-Host "4. Si la tabla no existe, creala:" -ForegroundColor Yellow
Write-Host "CREATE TABLE IF NOT EXISTS invited_users (" -ForegroundColor Gray
Write-Host "  id SERIAL PRIMARY KEY," -ForegroundColor Gray
Write-Host "  email TEXT UNIQUE NOT NULL," -ForegroundColor Gray
Write-Host "  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()" -ForegroundColor Gray
Write-Host ");" -ForegroundColor Gray

Write-Host ""
Write-Host "5. Dar permisos de lectura:" -ForegroundColor Yellow
Write-Host "GRANT SELECT ON invited_users TO anon;" -ForegroundColor Gray
Write-Host "GRANT SELECT ON invited_users TO authenticated;" -ForegroundColor Gray

Write-Host ""
Write-Host "6. Agregar tu email (reemplaza con tu email real):" -ForegroundColor Yellow
Write-Host "INSERT INTO invited_users (email)" -ForegroundColor Gray
Write-Host "VALUES ('tu-email@empresa.com')" -ForegroundColor Gray
Write-Host "ON CONFLICT (email) DO NOTHING;" -ForegroundColor Gray

Write-Host ""
Write-Host "7. Verificar que se agrego tu email:" -ForegroundColor Yellow
Write-Host "SELECT * FROM invited_users WHERE email = 'tu-email@empresa.com';" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 Después de ejecutar estos comandos:" -ForegroundColor Cyan
Write-Host "1. Reinicia el servidor: .\start-local.ps1" -ForegroundColor White
Write-Host "2. Abre: http://localhost:3000" -ForegroundColor White
Write-Host "3. Haz login con Google" -ForegroundColor White
Write-Host "4. Verifica que no aparezca el error 403" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Para ver el email exacto que se está validando:" -ForegroundColor Cyan
Write-Host "1. Abre herramientas de desarrollador (F12)" -ForegroundColor White
Write-Host "2. Ve a la pestaña Console" -ForegroundColor White
Write-Host "3. Busca los logs que empiecen con 🔍" -ForegroundColor White
Write-Host "4. Copia el email exacto que aparece" -ForegroundColor White
Write-Host "5. Agrega ese email exacto a la tabla invited_users" -ForegroundColor White 