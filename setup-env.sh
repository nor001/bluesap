#!/bin/bash

echo "========================================"
echo "  Configuracion de Variables de Entorno"
echo "========================================"
echo

echo "Este script te ayudara a configurar las variables de entorno para Supabase."
echo

echo "1. Ve a https://supabase.com y crea un proyecto"
echo "2. En tu proyecto, ve a Settings > API"
echo "3. Copia la 'Project URL' y 'anon public' key"
echo

read -p "Ingresa tu Project URL de Supabase: " SUPABASE_URL
read -p "Ingresa tu anon public key de Supabase: " SUPABASE_KEY

echo
echo "Creando archivo .env.local..."

cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF

echo
echo "✅ Archivo .env.local creado exitosamente!"
echo
echo "Ahora reinicia tu servidor de desarrollo:"
echo "npm run dev"
echo
echo "Para configurar Supabase completamente, sigue las instrucciones en SUPABASE_SETUP.md"
echo 