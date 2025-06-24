@echo off
echo 🔐 Configurando entorno corporativo...

REM Configurar variables de entorno para desarrollo local
set NODE_TLS_REJECT_UNAUTHORIZED=0

REM Configurar proxy (descomenta y ajusta según tu empresa)
REM set HTTP_PROXY=http://proxy.empresa.com:8080
REM set HTTPS_PROXY=http://proxy.empresa.com:8080

REM Configurar certificados (descomenta y ajusta la ruta)
REM set NODE_EXTRA_CA_CERTS=C:\path\to\certificados\empresa.crt

echo ✅ Entorno configurado
echo 🚀 Iniciando servidor de desarrollo...

REM Verificar que existe package.json
if exist "package.json" (
    echo 📦 Proyecto encontrado, iniciando servidor...
    npm run dev
) else (
    echo ❌ Error: No se encontró package.json
    echo 💡 Asegúrate de estar en el directorio correcto
    pause
) 