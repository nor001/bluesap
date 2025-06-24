@echo off
echo 🔒 Iniciando servidor de forma segura...

REM Verificar que existe .env.local
if not exist ".env.local" (
    echo ❌ Error: Archivo .env.local no encontrado
    echo 💡 Crea el archivo .env.local con tus credenciales de Supabase
    pause
    exit /b 1
)

echo ✅ Archivo .env.local encontrado
echo 🚀 Iniciando servidor...

REM Iniciar servidor (Next.js cargará automáticamente .env.local)
npm run dev 