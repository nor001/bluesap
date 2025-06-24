#!/bin/bash

echo "🚀 SAP Gestion - Setup de Migración Next.js"
echo "=============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

# Verificar TypeScript
echo ""
echo "🔍 Verificando TypeScript..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript configurado correctamente"
else
    echo "⚠️  Advertencias de TypeScript (esto es normal en la primera ejecución)"
fi

# Construir proyecto
echo ""
echo "🔨 Construyendo proyecto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Proyecto construido correctamente"
else
    echo "❌ Error al construir el proyecto"
    exit 1
fi

echo ""
echo "🎉 Setup completado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecutar en desarrollo: npm run dev"
echo "2. Abrir http://localhost:3000"
echo "3. Para desplegar en Vercel: vercel --prod"
echo ""
echo "📚 Documentación: README_NEXTJS.md"
echo "" 