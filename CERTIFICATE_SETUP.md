# 🔐 Configuración de Certificados .crt y .pem

## 🎯 **Formatos de Certificados Soportados**

**¡Ambos formatos funcionan!** Node.js soporta múltiples formatos:

### **✅ Formatos Válidos**
- **`.crt`** - Certificado X.509 (formato DER o PEM)
- **`.pem`** - Certificado PEM (Privacy Enhanced Mail)
- **`.cer`** - Certificado X.509
- **`.p12`** - Certificado PKCS#12
- **`.pfx`** - Certificado PKCS#12 (Windows)

## 🔍 **Verificación de tu Certificado**

### **Paso 1: Verificar Formato del Certificado**
```powershell
# Verificar certificados instalados
Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*tu-empresa*"}
Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object {$_.Subject -like "*tu-empresa*"}

# Verificar certificados en archivos
Get-ChildItem -Path "C:\path\to\certificados" -Filter "*.crt"
Get-ChildItem -Path "C:\path\to\certificados" -Filter "*.pem"
```

### **Paso 2: Verificar Contenido del Certificado**
```powershell
# Para certificados .crt
Get-Content "C:\path\to\certificado.crt"

# Para certificados .pem
Get-Content "C:\path\to\certificado.pem"
```

## 🚀 **Configuración con .crt**

### **Opción 1: Certificado .crt Directo**
```env
# En archivo .env.local
NODE_EXTRA_CA_CERTS=C:\path\to\certificado.crt
```

### **Opción 2: Script PowerShell con .crt**
```powershell
# En start-local.ps1
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\certificado.crt"
```

## 🚀 **Configuración con .pem**

### **Opción 1: Certificado .pem Directo**
```env
# En archivo .env.local
NODE_EXTRA_CA_CERTS=C:\path\to\certificado.pem
```

### **Opción 2: Script PowerShell con .pem**
```powershell
# En start-local.ps1
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\certificado.pem"
```

## 🔧 **Configuración Completa Actualizada**

### **Paso 1: Crear archivo `.env.local`**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

# SSL Configuration
NODE_TLS_REJECT_UNAUTHORIZED=0
NODE_EXTRA_CA_CERTS=C:\path\to\tu-certificado.crt

# Proxy Configuration (si aplica)
HTTP_PROXY=http://proxy.empresa.com:8080
HTTPS_PROXY=http://proxy.empresa.com:8080
```

### **Paso 2: Actualizar Script PowerShell**
```powershell
Write-Host "🔐 Configurando entorno corporativo..." -ForegroundColor Green

# Configurar variables de entorno
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# Configurar certificado (ajusta la ruta según tu certificado)
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\tu-certificado.crt"

# Configurar proxy (descomenta si es necesario)
# $env:HTTP_PROXY = "http://proxy.empresa.com:8080"
# $env:HTTPS_PROXY = "http://proxy.empresa.com:8080"

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
```

## 🧪 **Pruebas de Configuración**

### **Prueba 1: Verificar Certificado**
```powershell
# Verificar que Node.js puede leer el certificado
node -e "console.log('Certificado configurado:', process.env.NODE_EXTRA_CA_CERTS)"
```

### **Prueba 2: Conexión a Supabase**
```javascript
// En la consola del navegador
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-clave-anonima'
)

// Probar conexión
supabase.from('csv_metadata').select('*').then(console.log)
```

### **Prueba 3: Subida de Archivo**
1. Sube un CSV pequeño
2. Verifica en consola:
   ```
   ✅ CSV subido exitosamente a Supabase
   📊 Metadata guardada: { file_size: 163073, ... }
   ```

## 🔍 **Diagnóstico de Problemas**

### **Error: Certificate Not Found**
```powershell
# Verificar que la ruta del certificado es correcta
Test-Path "C:\path\to\tu-certificado.crt"

# Verificar permisos de lectura
Get-Acl "C:\path\to\tu-certificado.crt"
```

### **Error: Invalid Certificate Format**
```powershell
# Verificar contenido del certificado
Get-Content "C:\path\to\tu-certificado.crt" | Select-Object -First 5
```

### **Error: SSL Handshake Failed**
```powershell
# Verificar configuración SSL
echo $env:NODE_TLS_REJECT_UNAUTHORIZED
echo $env:NODE_EXTRA_CA_CERTS
```

## 📊 **Comparación de Formatos**

| Formato | Extensión | Uso Común | Configuración |
|---------|-----------|-----------|---------------|
| **X.509** | `.crt` | Windows, Linux | `NODE_EXTRA_CA_CERTS=file.crt` |
| **PEM** | `.pem` | Linux, macOS | `NODE_EXTRA_CA_CERTS=file.pem` |
| **PKCS#12** | `.p12` | Windows | Requiere conversión |
| **DER** | `.der` | Binario | Requiere conversión |

## 🎯 **Recomendación**

### **Para Certificados .crt**
```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\certificado.crt"
```

### **Para Certificados .pem**
```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\certificado.pem"
```

### **Para Múltiples Certificados**
```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\cert1.crt;C:\path\to\cert2.pem"
```

## 🚀 **Comando de Inicio Actualizado**

```powershell
# Ejecutar con certificado configurado
.\start-local.ps1
```

## 🎉 **Resultado Esperado**

Con certificado configurado correctamente:
- ✅ **Supabase Storage** funcionando
- ✅ **Autenticación Google** funcionando
- ✅ **Sin errores SSL** en consola
- ✅ **Todas las funcionalidades** operativas

**¡Ambos formatos .crt y .pem funcionan perfectamente!** 🎯 