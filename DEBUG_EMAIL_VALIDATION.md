# 🔍 Diagnóstico: "Tu correo no está invitado"

## 🎯 **Problema Identificado**

Los logs muestran:
```
GET /auth/callback 200 in 2781ms
POST /api/auth-validate 403 in 1143ms
POST /api/auth-validate 403 in 813ms
```

**Esto significa:**
- ✅ **Social login funciona** (callback exitoso)
- ✅ **Autenticación exitosa** en Supabase
- ❌ **Email no está en tabla `invited_users`**

## 🔍 **Diagnóstico Paso a Paso**

### **Paso 1: Verificar Email que se está Validando**

Agrega logs de debug al componente `AuthCallback.tsx`:

```typescript
// En app/components/AuthCallback.tsx, línea 18
const { data: { user } } = await supabase.auth.getUser();
console.log('🔍 Usuario autenticado:', user);
console.log('📧 Email del usuario:', user?.email);

if (!user || !user.email) {
  setError('No se pudo obtener el usuario autenticado.');
  setLoading(false);
  return;
}

// Antes de la validación
console.log('🔍 Validando email:', user.email);
```

### **Paso 2: Verificar Tabla `invited_users` en Supabase**

En Supabase SQL Editor, ejecuta:

```sql
-- Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'invited_users'
);

-- Verificar contenido de la tabla
SELECT * FROM invited_users;

-- Verificar emails específicos (reemplaza con tu email)
SELECT * FROM invited_users WHERE email = 'tu-email@empresa.com';

-- Verificar emails similares
SELECT * FROM invited_users WHERE email LIKE '%tu-email%';
```

### **Paso 3: Verificar Permisos de la Tabla**

```sql
-- Verificar permisos
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'invited_users';

-- Dar permisos si es necesario
GRANT SELECT ON invited_users TO anon;
GRANT SELECT ON invited_users TO authenticated;
```

## 🚀 **Solución Rápida**

### **Opción 1: Agregar tu Email a la Tabla**

En Supabase SQL Editor:

```sql
-- Agregar tu email (reemplaza con tu email real)
INSERT INTO invited_users (email) 
VALUES ('tu-email@empresa.com')
ON CONFLICT (email) DO NOTHING;

-- Verificar que se agregó
SELECT * FROM invited_users WHERE email = 'tu-email@empresa.com';
```

### **Opción 2: Verificar Email Exacto**

1. **Abre herramientas de desarrollador** (F12)
2. **Ve a la pestaña Console**
3. **Busca los logs** que agregamos:
   ```
   🔍 Usuario autenticado: {user object}
   📧 Email del usuario: tu-email@empresa.com
   🔍 Validando email: tu-email@empresa.com
   ```
4. **Copia el email exacto** que aparece
5. **Agrega ese email exacto** a la tabla `invited_users`

### **Opción 3: Script de Debug Mejorado**

Crea un archivo temporal `debug-email.js`:

```javascript
// En la consola del navegador (F12)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-clave-anonima'
)

// Obtener usuario actual
supabase.auth.getUser().then(({ data: { user } }) => {
  console.log('🔍 Usuario:', user);
  console.log('📧 Email:', user?.email);
  
  // Verificar en tabla invited_users
  if (user?.email) {
    supabase.from('invited_users')
      .select('*')
      .eq('email', user.email)
      .then(({ data, error }) => {
        console.log('🔍 Resultado de búsqueda:', data);
        console.log('❌ Error si existe:', error);
      });
  }
});
```

## 🔧 **Verificación de Configuración**

### **Verificar Variables de Entorno**

```powershell
# Verificar que las variables estén cargadas
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Verificar Archivo .env.local**

Asegúrate de que el archivo `.env.local` tenga las credenciales correctas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## 🧪 **Pruebas de Verificación**

### **Prueba 1: Verificar Email en Consola**
1. Abre herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca los logs de debug
4. Copia el email exacto

### **Prueba 2: Verificar en Supabase**
1. Ve a Supabase Dashboard
2. SQL Editor
3. Ejecuta: `SELECT * FROM invited_users;`
4. Verifica que tu email esté en la lista

### **Prueba 3: Probar Autenticación**
1. Reinicia el servidor: `.\start-local.ps1`
2. Abre: `http://localhost:3000`
3. Haz login con Google
4. Verifica que no aparezca el error 403

## 🆘 **Solución de Problemas Comunes**

### **Problema: Email no coincide exactamente**
**Solución:**
- Verifica mayúsculas/minúsculas
- Verifica espacios extra
- Verifica dominio completo

### **Problema: Tabla no existe**
**Solución:**
```sql
CREATE TABLE IF NOT EXISTS invited_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Problema: Sin permisos**
**Solución:**
```sql
GRANT SELECT ON invited_users TO anon;
GRANT SELECT ON invited_users TO authenticated;
```

## 📊 **Indicadores de Éxito**

### **En Consola del Navegador:**
```
🔍 Usuario autenticado: {user object}
📧 Email del usuario: tu-email@empresa.com
🔍 Validando email: tu-email@empresa.com
```

### **En Consola del Servidor:**
```
POST /api/auth-validate 200 in 750ms  ← Cambia de 403 a 200
```

### **En la Interfaz:**
- ✅ **Sin mensaje de error**
- ✅ **Acceso a la aplicación**
- ✅ **Funcionalidades completas**

## 🎯 **Comandos de Verificación**

```powershell
# 1. Verificar configuración
.\diagnose-auth.ps1

# 2. Reiniciar servidor
.\start-local.ps1

# 3. Probar autenticación
# Abrir: http://localhost:3000
# Hacer clic en "Continuar con Google"
# Verificar logs en consola (F12)
```

## 🎉 **Resultado Esperado**

Después de agregar tu email a la tabla `invited_users`:
- ✅ **Error 403 → 200**
- ✅ **Sin mensaje "Tu correo no está invitado"**
- ✅ **Acceso completo a la aplicación**
- ✅ **Todas las funcionalidades operativas**

**¡El problema se resolverá una vez que agregues tu email exacto a la tabla `invited_users`!** 🚀 