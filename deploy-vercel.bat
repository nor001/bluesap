@echo off
echo ========================================
echo   Despliegue en Vercel - SAP Gestion
echo ========================================
echo.

echo Este script te ayudara a preparar el proyecto para Vercel.
echo.

echo 1. Verificando cambios pendientes...
git status

echo.
echo 2. Agregando todos los archivos...
git add .

echo.
echo 3. Commit de cambios...
set /p COMMIT_MSG="Mensaje del commit (o presiona Enter para usar el default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG="Sistema híbrido y autenticación implementados"
git commit -m %COMMIT_MSG%

echo.
echo 4. Subiendo a GitHub...
git push origin main

echo.
echo ✅ Proyecto preparado para Vercel!
echo.
echo Ahora sigue estos pasos:
echo.
echo 1. Ve a https://vercel.com
echo 2. Crea una cuenta o inicia sesion
echo 3. Haz clic en "New Project"
echo 4. Importa tu repositorio de GitHub
echo 5. Configura las variables de entorno:
echo    - NEXT_PUBLIC_SUPABASE_URL
echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo 6. Despliega!
echo.
echo Para mas detalles, revisa VERCEL_DEPLOYMENT.md
echo.
pause 