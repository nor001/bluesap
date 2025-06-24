# 🚀 Inicio Rápido - Pruebas Locales

## 🎯 **Respuesta a tu Pregunta**

**¿Puedes ejecutar todo localmente con certificados?**

**¡SÍ!** Si tienes certificados SSL corporativos configurados, puedes ejecutar:
- ✅ **Supabase Storage** funcionando
- ✅ **Autenticación Google** funcionando  
- ✅ **Todas las funcionalidades** disponibles

## 🔍 **Verificación Rápida de Certificados**

### **Paso 1: Verificar Certificados Instalados**
```powershell
# Ejecuta este comando para ver certificados corporativos
Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*corporate*" -or $_.Subject -like "*empresa*"}
```

### **Paso 2: Verificar Variables de Entorno**
```powershell
# Verificar si hay proxy configurado
echo $env:HTTP_PROXY
echo $env:HTTPS_PROXY
```

## 🚀 **Inicio Rápido (3 Opciones)**

### **Opción 1: Script PowerShell (Recomendado)**
```powershell
.\start-local.ps1
```

### **Opción 2: Script Batch**
```cmd
start-local.bat
```

### **Opción 3: Manual**
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
npm run dev
```

## 📊 **¿Qué Funciona Según tu Configuración?**

| Tienes Certificados | Procesamiento CSV | Timeline | Supabase Storage | Autenticación |
|-------------------|------------------|----------|------------------|---------------|
| **✅ SÍ** | ✅ Local | ✅ Local | ✅ Funciona | ✅ Funciona |
| **❌ NO** | ✅ Local | ✅ Local | ❌ Fallback Local | ❌ No disponible |

## 🔧 **Configuración Completa (Si Tienes Certificados)**

### **Paso 1: Crear archivo `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### **Paso 2: Configurar Supabase**
1. Crea proyecto en [Supabase](https://supabase.com)
2. Configura Google OAuth
3. Crea tabla `invited_users`

### **Paso 3: Ejecutar**
```powershell
.\start-local.ps1
```

## 🧪 **Pruebas de Funcionamiento**

### **Prueba Básica (Siempre Funciona)**
1. Ejecuta: `.\start-local.ps1`
2. Abre: `http://localhost:3000`
3. Sube CSV y verifica:
   - ✅ Procesamiento correcto
   - ✅ Timeline funcionando
   - ✅ Filtros operativos

### **Prueba Completa (Si Tienes Certificados)**
1. Configura `.env.local` con credenciales Supabase
2. Ejecuta: `.\start-local.ps1`
3. Prueba:
   - ✅ Subida a Supabase Storage
   - ✅ Autenticación con Google
   - ✅ Colaboración en tiempo real

## 🔍 **Indicadores de Éxito**

### **En Consola del Navegador**
```
🔄 Iniciando proceso de subida a Supabase...
✅ CSV subido exitosamente a Supabase
📊 Metadata guardada: { file_size: 163073, ... }
```

### **En la Interfaz**
- ✅ **Fecha de actualización** visible
- ✅ **Hora de actualización** visible
- ✅ **Tamaño del archivo** correcto

## 🆘 **Solución de Problemas**

### **Error: SSL Certificate**
```powershell
# El script ya configura esto automáticamente
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

### **Error: Proxy Connection**
Edita `start-local.ps1` y descomenta:
```powershell
$env:HTTP_PROXY = "http://proxy.empresa.com:8080"
$env:HTTPS_PROXY = "http://proxy.empresa.com:8080"
```

### **Error: Supabase Connection**
1. Verifica credenciales en `.env.local`
2. Verifica conectividad a internet
3. Verifica configuración de proxy

## 🎯 **Recomendación Final**

### **Para Pruebas Inmediatas**
```powershell
.\start-local.ps1
```
**¡Funciona inmediatamente con todas las funcionalidades principales!**

### **Para Funcionalidad Completa**
1. Configura certificados y Supabase
2. Usa el mismo comando: `.\start-local.ps1`

## 🎉 **¡Ya Puedes Empezar!**

**Ejecuta este comando y abre `http://localhost:3000`:**
```powershell
.\start-local.ps1
```

**¡Tu aplicación estará funcionando localmente!** 🚀 