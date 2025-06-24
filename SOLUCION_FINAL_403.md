# 🔧 Solución Final al Error 403

## 🎯 **Problema Confirmado**

- ✅ **Email correcto:** `normantinco@gmail.com`
- ✅ **Autenticación funciona**
- ❌ **Endpoint devuelve 403** - Email no encontrado en tabla

## 🚀 **Solución Paso a Paso**

### **Paso 1: Verificar Variables de Entorno**

Ejecuta en PowerShell:
```powershell
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Si están vacías**, ejecuta:
```powershell
.\setup-env.ps1
```

### **Paso 2: Verificar Tabla en Supabase**

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Tu proyecto → **SQL Editor**
3. Ejecuta estos comandos:

```sql
-- Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'invited_users'
);

-- Ver contenido de la tabla
SELECT * FROM invited_users;

-- Buscar tu email específico
SELECT * FROM invited_users WHERE email = 'normantinco@gmail.com';
```

### **Paso 3: Si la Tabla No Existe**

```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS invited_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dar permisos
GRANT SELECT ON invited_users TO anon;
GRANT SELECT ON invited_users TO authenticated;

-- Agregar tu email
INSERT INTO invited_users (email) 
VALUES ('normantinco@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### **Paso 4: Si la Tabla Existe pero No Encuentra el Email**

```sql
-- Verificar permisos
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'invited_users';

-- Dar permisos si faltan
GRANT SELECT ON invited_users TO anon;
GRANT SELECT ON invited_users TO authenticated;

-- Agregar email si no está
INSERT INTO invited_users (email) 
VALUES ('normantinco@gmail.com')
ON CONFLICT (email) DO NOTHING;
```

### **Paso 5: Probar Conexión Manual**

1. Abre herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Ejecuta este código (reemplaza con tus credenciales):

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-clave-anonima'
);

// Probar conexión
supabase.from('invited_users').select('*').then(console.log);

// Buscar tu email
supabase.from('invited_users')
  .select('*')
  .eq('email', 'normantinco@gmail.com')
  .then(console.log);
```

### **Paso 6: Reiniciar y Probar**

```powershell
# Reiniciar servidor
.\start-local.ps1

# Abrir navegador
# http://localhost:3000
# Hacer login con Google
```

## 🔍 **Diagnóstico con Logs**

Ahora el endpoint tiene logs detallados. Después de hacer login, revisa la **consola del servidor** (donde ejecutaste `npm run dev`) y busca:

```
🔍 [auth-validate] Iniciando validación...
📧 [auth-validate] Email recibido: normantinco@gmail.com
🔍 [auth-validate] Consultando tabla invited_users...
📊 [auth-validate] Resultado de consulta: { data: ..., error: ... }
```

## 🆘 **Posibles Errores y Soluciones**

### **Error: "Supabase no configurado"**
- Verifica variables de entorno
- Ejecuta `.\setup-env.ps1`

### **Error: "Table does not exist"**
- Crea la tabla con el SQL de arriba

### **Error: "Permission denied"**
- Ejecuta los comandos GRANT

### **Error: "No rows returned"**
- El email no está en la tabla
- Agrega el email con INSERT

## 📊 **Indicadores de Éxito**

### **En Consola del Servidor:**
```
🔍 [auth-validate] Iniciando validación...
📧 [auth-validate] Email recibido: normantinco@gmail.com
🔍 [auth-validate] Consultando tabla invited_users...
📊 [auth-validate] Resultado de consulta: { data: { email: 'normantinco@gmail.com' }, error: null }
✅ [auth-validate] Usuario autorizado: { email: 'normantinco@gmail.com' }
```

### **En Consola del Navegador:**
```
🔍 Resultado de validación: 200 OK
✅ Usuario autorizado, redirigiendo...
```

## 🎯 **Comandos de Verificación**

```powershell
# 1. Verificar configuración
echo $env:NEXT_PUBLIC_SUPABASE_URL
echo $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Reiniciar servidor
.\start-local.ps1

# 3. Probar autenticación
# Abrir: http://localhost:3000
# Login con Google
# Revisar logs en consola del servidor
```

## 🎉 **Resultado Esperado**

Después de completar todos los pasos:
- ✅ **Error 403 → 200**
- ✅ **Sin mensaje "Tu correo no está invitado"**
- ✅ **Acceso completo a la aplicación**
- ✅ **Todas las funcionalidades operativas**

**¡El problema se resolverá una vez que el email esté en la tabla y los permisos estén correctos!** 🚀 