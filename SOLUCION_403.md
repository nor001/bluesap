# 🔧 Solución al Error 403 - Autenticación

## 🎯 **Problema Identificado**

Los logs muestran:
```
GET /auth/callback 200 in 7496ms
POST /api/auth-validate 403 in 1695ms
POST /api/auth-validate 403 in 1544ms
```

**Esto significa:**
- ✅ **Autenticación funciona** (callback exitoso)
- ❌ **Autorización falla** (email no autorizado)

## 🚀 **Solución Paso a Paso**

### **Paso 1: Configurar Variables de Entorno**

Ejecuta el script de configuración:
```powershell
.\setup-env.ps1
```

**El script te pedirá:**
1. **NEXT_PUBLIC_SUPABASE_URL** (de Supabase Dashboard)
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (de Supabase Dashboard)

### **Paso 2: Obtener Credenciales de Supabase**

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Paso 3: Crear Tabla `invited_users`**

En Supabase SQL Editor, ejecuta:

```sql
-- Crear tabla de usuarios invitados
CREATE TABLE IF NOT EXISTS invited_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar tu email (reemplaza con tu email real)
INSERT INTO invited_users (email) 
VALUES ('tu-email@empresa.com')
ON CONFLICT (email) DO NOTHING;

-- Verificar que se creó correctamente
SELECT * FROM invited_users;
```

### **Paso 4: Configurar OAuth en Supabase**

1. En Supabase Dashboard, ve a **Authentication** → **Settings**
2. Configura:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### **Paso 5: Configurar Google OAuth**

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea credenciales OAuth 2.0
3. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Copia Client ID y Secret a Supabase

### **Paso 6: Reiniciar Servidor**

```powershell
.\start-local.ps1
```

## 🧪 **Pruebas de Verificación**

### **Prueba 1: Verificar Conexión a Supabase**
```javascript
// En la consola del navegador (F12)
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-clave-anonima'
)

// Probar conexión
supabase.from('invited_users').select('*').then(console.log)
```

### **Prueba 2: Verificar Autenticación**
1. Haz clic en "Continuar con Google"
2. Verifica que no hay errores 403
3. Deberías ver acceso a la aplicación

## 🔍 **Diagnóstico Detallado**

### **Verificar Variables de Entorno**
```powershell
# Verificar que las variables estén cargadas
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Verificar Tabla en Supabase**
```sql
-- Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'invited_users'
);

-- Verificar emails en la tabla
SELECT email FROM invited_users;
```

### **Verificar Permisos de Tabla**
```sql
-- Dar permisos de lectura
GRANT SELECT ON invited_users TO anon;
```

## 📊 **Indicadores de Éxito**

### **En Consola del Servidor:**
```
✓ Compiled in 1665ms (2630 modules)
GET / 200 in 173ms
GET /auth/callback 200 in 79ms
POST /api/auth-validate 200 in 750ms  ← Cambia de 403 a 200
```

### **En la Interfaz:**
- ✅ **Login exitoso** sin errores
- ✅ **Acceso a la aplicación** después del login
- ✅ **Funcionalidades completas** disponibles

## 🆘 **Solución de Problemas**

### **Error: "Supabase no está configurado"**
1. Verifica que `.env.local` existe
2. Verifica que las credenciales son correctas
3. Reinicia el servidor

### **Error: "No se pudo obtener el usuario autenticado"**
1. Verifica configuración de OAuth en Supabase
2. Verifica redirect URLs
3. Verifica Google OAuth credentials

### **Error: "Tu correo no está invitado"**
1. Verifica que tu email esté en la tabla `invited_users`
2. Verifica que el email coincida exactamente
3. Verifica permisos de la tabla

## 🎯 **Comandos de Verificación**

```powershell
# 1. Configurar entorno
.\setup-env.ps1

# 2. Verificar configuración
.\diagnose-auth.ps1

# 3. Iniciar servidor
.\start-local.ps1
```

## 🎉 **Resultado Esperado**

Después de completar todos los pasos:
- ✅ **Error 403 resuelto**
- ✅ **Autenticación Google** funcionando
- ✅ **Acceso completo** a la aplicación
- ✅ **Todas las funcionalidades** operativas

**¡El error 403 se resolverá una vez que configures correctamente Supabase y la tabla `invited_users`!** 🚀 