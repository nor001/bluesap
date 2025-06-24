# 🔐 Configuración Local con Certificados SSL Corporativos

## 🎯 **¿Puedes Ejecutar Todo Localmente?**

**¡SÍ!** Si tienes acceso a los certificados SSL corporativos, puedes ejecutar la aplicación completa localmente con:
- ✅ **Supabase Storage** funcionando
- ✅ **Autenticación Google** funcionando
- ✅ **Todas las funcionalidades** disponibles

## 🔍 **Verificación de Certificados**

### **Paso 1: Verificar Certificados Instalados**
```powershell
# Verificar certificados en Windows
Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*tu-empresa*"}
Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object {$_.Subject -like "*tu-empresa*"}
```

### **Paso 2: Verificar Variables de Entorno**
```powershell
# Verificar si hay variables de proxy configuradas
echo $env:HTTP_PROXY
echo $env:HTTPS_PROXY
echo $env:NODE_TLS_REJECT_UNAUTHORIZED
```

## 🚀 **Configuración Completa Local**

### **Opción 1: Configurar Node.js con Certificados**

#### **Paso 1: Configurar Variables de Entorno**
Crea un archivo `.env.local` en la raíz del proyecto:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

# SSL Configuration (si es necesario)
NODE_TLS_REJECT_UNAUTHORIZED=0
NODE_EXTRA_CA_CERTS=C:\path\to\certificados\empresa.crt
```

#### **Paso 2: Configurar Proxy (si aplica)**
```env
# Proxy Configuration
HTTP_PROXY=http://proxy.empresa.com:8080
HTTPS_PROXY=http://proxy.empresa.com:8080
```

### **Opción 2: Script de Inicio con Configuración**

Crea un archivo `start-local.bat`:
```batch
@echo off
echo 🔐 Configurando entorno corporativo...

REM Configurar variables de entorno
set NODE_TLS_REJECT_UNAUTHORIZED=0
set HTTP_PROXY=http://proxy.empresa.com:8080
set HTTPS_PROXY=http://proxy.empresa.com:8080

REM Configurar certificados (si es necesario)
set NODE_EXTRA_CA_CERTS=C:\path\to\certificados\empresa.crt

echo ✅ Entorno configurado
echo 🚀 Iniciando servidor de desarrollo...

cd "SAP Gestion Next.js"
npm run dev
```

### **Opción 3: Configuración PowerShell**

Crea un archivo `start-local.ps1`:
```powershell
Write-Host "🔐 Configurando entorno corporativo..." -ForegroundColor Green

# Configurar variables de entorno
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:HTTP_PROXY = "http://proxy.empresa.com:8080"
$env:HTTPS_PROXY = "http://proxy.empresa.com:8080"

# Configurar certificados (si es necesario)
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\certificados\empresa.crt"

Write-Host "✅ Entorno configurado" -ForegroundColor Green
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Yellow

Set-Location "SAP Gestion Next.js"
npm run dev
```

## 🔧 **Configuración de Supabase**

### **Paso 1: Configurar Proyecto Supabase**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto o usa uno existente
3. Copia las credenciales:
   - Project URL
   - Anon Key

### **Paso 2: Configurar Storage**
En Supabase SQL Editor:
```sql
-- Crear bucket para CSV
INSERT INTO storage.buckets (id, name, public) 
VALUES ('csv-files', 'csv-files', true);

-- Configurar políticas de acceso
CREATE POLICY "CSV files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'csv-files');

CREATE POLICY "Authenticated users can upload CSV" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'csv-files' AND auth.role() = 'authenticated');
```

### **Paso 3: Configurar Autenticación**
En Supabase Dashboard:
1. **Authentication** → **Settings**
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs**: `http://localhost:3000/auth/callback`

### **Paso 4: Configurar Google OAuth**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea credenciales OAuth 2.0
3. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Copia Client ID y Secret a Supabase

## 🧪 **Pruebas de Configuración**

### **Prueba 1: Conexión a Supabase**
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

### **Prueba 2: Subida de Archivo**
1. Sube un CSV pequeño
2. Verifica en consola:
   ```
   ✅ CSV subido exitosamente a Supabase
   📊 Metadata guardada: { file_size: 163073, ... }
   ```

### **Prueba 3: Autenticación**
1. Haz clic en "Continuar con Google"
2. Verifica redirección exitosa
3. Verifica acceso a la aplicación

## 🔍 **Diagnóstico de Problemas**

### **Error: SSL Certificate**
```bash
# Solución 1: Configurar certificados
set NODE_EXTRA_CA_CERTS=C:\path\to\certificados\empresa.crt

# Solución 2: Deshabilitar verificación (solo desarrollo)
set NODE_TLS_REJECT_UNAUTHORIZED=0
```

### **Error: Proxy Connection**
```bash
# Configurar proxy
set HTTP_PROXY=http://proxy.empresa.com:8080
set HTTPS_PROXY=http://proxy.empresa.com:8080
```

### **Error: Supabase Connection**
1. Verifica variables de entorno
2. Verifica conectividad a internet
3. Verifica configuración de proxy

## 📊 **Comparación: Con vs Sin Certificados**

| Funcionalidad | Sin Certificados | Con Certificados |
|---------------|------------------|------------------|
| **Procesamiento CSV** | ✅ Local | ✅ Local |
| **Timeline** | ✅ Local | ✅ Local |
| **Filtros/Métricas** | ✅ Local | ✅ Local |
| **Supabase Storage** | ❌ No funciona | ✅ Funciona |
| **Autenticación** | ❌ No funciona | ✅ Funciona |
| **Colaboración** | ❌ No funciona | ✅ Funciona |

## 🎯 **Pasos para Configurar**

### **Si Tienes Certificados:**
1. **Configura variables de entorno** (`.env.local`)
2. **Configura proxy** (si aplica)
3. **Configura Supabase** (proyecto + OAuth)
4. **Ejecuta**: `npm run dev`
5. **Prueba**: Sube CSV y autenticación

### **Si No Tienes Certificados:**
1. **Usa sistema híbrido** (ya funciona)
2. **Para producción**: Despliega en Vercel

## 🚀 **Comando de Inicio Rápido**

```powershell
# PowerShell (recomendado)
.\start-local.ps1

# O manualmente
cd "SAP Gestion Next.js"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
npm run dev
```

## 🎉 **Resultado Esperado**

Con certificados configurados correctamente:
- ✅ **Supabase Storage** funcionando
- ✅ **Autenticación Google** funcionando
- ✅ **Colaboración en tiempo real** disponible
- ✅ **Todas las funcionalidades** operativas

**¡Puedes tener la aplicación completa funcionando localmente!** 🎯 