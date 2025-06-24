# 🔧 Configuración Rápida de Supabase - Resolver Error 403

## 🎯 **Problema Identificado**

El error `POST /api/auth-validate 403` indica que:
- ✅ **Autenticación funciona** (no hay errores SSL)
- ❌ **Autorización falla** (email no está en tabla `invited_users`)

## 🚀 **Solución Rápida**

### **Paso 1: Crear Tabla `invited_users` en Supabase**

Ve a [Supabase Dashboard](https://supabase.com/dashboard) y ejecuta este SQL:

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

### **Paso 2: Verificar Configuración de Variables de Entorno**

Crea o edita el archivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

# SSL Configuration
NODE_TLS_REJECT_UNAUTHORIZED=0
NODE_EXTRA_CA_CERTS=C:\path\to\tu-certificado.crt
```

### **Paso 3: Obtener Credenciales de Supabase**

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL**
   - **anon public** key

## 🧪 **Pruebas de Configuración**

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

## 🔍 **Diagnóstico del Error 403**

### **Causas Comunes:**

1. **Tabla `invited_users` no existe**
   ```sql
   -- Verificar si existe
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'invited_users'
   );
   ```

2. **Email no está en la tabla**
   ```sql
   -- Verificar emails en la tabla
   SELECT email FROM invited_users;
   ```

3. **Credenciales incorrectas**
   - Verifica `NEXT_PUBLIC_SUPABASE_URL`
   - Verifica `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Permisos de tabla**
   ```sql
   -- Dar permisos de lectura
   GRANT SELECT ON invited_users TO anon;
   ```

## 🚀 **Script de Configuración Automática**

Ejecuta este script para configurar todo automáticamente:

```powershell
.\setup-certificate.ps1
```

**El script te pedirá:**
1. Ruta de tu certificado
2. Credenciales de Supabase
3. Tu email para agregar a la tabla

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

## 🎯 **Pasos para Resolver**

### **Opción 1: Configuración Manual**
1. **Crear tabla** `invited_users` en Supabase
2. **Agregar tu email** a la tabla
3. **Verificar credenciales** en `.env.local`
4. **Reiniciar servidor**: `.\start-local.ps1`

### **Opción 2: Configuración Automática**
1. **Ejecutar**: `.\setup-certificate.ps1`
2. **Seguir instrucciones** del script
3. **Probar autenticación**

## 🎉 **Resultado Esperado**

Después de la configuración:
- ✅ **Error 403 resuelto**
- ✅ **Autenticación Google** funcionando
- ✅ **Acceso completo** a la aplicación
- ✅ **Todas las funcionalidades** operativas

**¡El error 403 se resolverá una vez que configures la tabla `invited_users`!** 🚀 