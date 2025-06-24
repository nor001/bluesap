Write-Host "🚀 Iniciando servidor con variables de entorno..." -ForegroundColor Green

# Configurar variables de entorno directamente
$env:NEXT_PUBLIC_SUPABASE_URL = "https://lxjwygbaofsafcqtgdrd.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4and5Z2Jhb2ZzYWZjcXRnZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTIwMjIsImV4cCI6MjA1ODg2ODAyMn0.GJvkOdCeRywwhLrJ-8QkIL4uuYT4kn2eR6ecpDrZ2LlE"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:NODE_EXTRA_CA_CERTS = "C:\temp\Zscaler_Root_CA.pem"

Write-Host "✅ Variables configuradas" -ForegroundColor Green
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Yellow

npm run dev 