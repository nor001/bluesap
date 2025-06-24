# 🧪 Pruebas Locales - Guía Completa

## 🎯 **Estado Actual: Sistema Híbrido Funcionando**

Tu aplicación **ya funciona localmente** con el sistema híbrido implementado:

### **✅ Lo que Funciona Ahora**
- **Procesamiento de CSV**: Completamente funcional
- **Asignación de recursos**: Completamente funcional
- **Timeline interactivo**: Completamente funcional
- **Filtros y métricas**: Completamente funcional
- **Almacenamiento local**: CSV guardado en localStorage
- **Metadata con fecha/hora**: Visible en la interfaz

### **❌ Lo que No Funciona (Por Restricciones Corporativas)**
- **Supabase Storage**: Bloqueado por certificados SSL
- **Autenticación con Google**: Bloqueado por certificados SSL

## 🚀 **Opción 1: Usar Sistema Híbrido (Recomendado)**

### **Ventajas**
- ✅ **Funciona inmediatamente** sin configuración
- ✅ **Todas las funcionalidades principales** disponibles
- ✅ **Datos persistentes** en el navegador
- ✅ **No requiere VPN** o configuración especial

### **Cómo Usar**
```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
http://localhost:3000

# 3. Subir CSV y probar funcionalidades
```

### **Lo que Verás**
- ✅ **Fecha/hora de actualización** en la interfaz
- ✅ **Procesamiento completo** de CSV
- ✅ **Timeline interactivo** funcionando
- ✅ **Filtros y métricas** operativos

## 🔧 **Opción 2: Configurar Supabase Localmente**

### **Paso 1: Configurar Variables de Entorno**
Crea un archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### **Paso 2: Configurar Tabla de Usuarios**
En Supabase SQL Editor:
```sql
-- Crear tabla de usuarios invitados
CREATE TABLE invited_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar tu email
INSERT INTO invited_users (email) VALUES ('tu-email@empresa.com');
```

### **Paso 3: Configurar Google OAuth**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea credenciales OAuth 2.0
3. Agrega URL de redirección: `http://localhost:3000/auth/callback`
4. Copia Client ID y Secret a Supabase

### **Paso 4: Configurar Supabase Auth**
En Supabase:
1. Authentication → Settings
2. Site URL: `http://localhost:3000`
3. Redirect URLs: `http://localhost:3000/auth/callback`

## 🌐 **Opción 3: Usar VPN o Proxy Corporativo**

### **Si tu empresa tiene VPN**
1. Conecta a la VPN corporativa
2. Configura Supabase normalmente
3. Prueba autenticación y storage

### **Si tu empresa tiene proxy**
```bash
# Configurar proxy en Node.js
export HTTP_PROXY=http://proxy.empresa.com:8080
export HTTPS_PROXY=http://proxy.empresa.com:8080

# Iniciar servidor
npm run dev
```

## 🧪 **Guía de Pruebas Locales**

### **Prueba 1: Funcionalidad Básica**
```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
http://localhost:3000

# 3. Subir archivo CSV
# 4. Verificar que se procese correctamente
# 5. Verificar timeline y métricas
```

### **Prueba 2: Sistema Híbrido**
```bash
# 1. Subir CSV
# 2. Verificar logs en consola:
#    💾 Guardando CSV localmente como fallback...
#    ✅ CSV guardado localmente: { file_size: 163073, ... }

# 3. Verificar fecha/hora en interfaz
# 4. Recargar página y verificar persistencia
```

### **Prueba 3: Autenticación (Si Configurada)**
```bash
# 1. Configurar Supabase y Google OAuth
# 2. Hacer clic en "Continuar con Google"
# 3. Verificar redirección a callback
# 4. Verificar acceso a la aplicación
```

## 📊 **Comparación de Opciones**

| Opción | Configuración | Funcionalidad | Autenticación | Storage |
|--------|---------------|---------------|---------------|---------|
| **Sistema Híbrido** | ✅ Ninguna | ✅ Completa | ❌ No | ✅ Local |
| **Supabase Local** | ⚠️ Media | ✅ Completa | ✅ Sí | ✅ Supabase |
| **VPN/Proxy** | ⚠️ Alta | ✅ Completa | ✅ Sí | ✅ Supabase |

## 🎯 **Recomendación**

### **Para Desarrollo Rápido**
Usa el **Sistema Híbrido** (Opción 1):
- ✅ **Funciona inmediatamente**
- ✅ **Todas las funcionalidades principales**
- ✅ **Ideal para testing y desarrollo**

### **Para Producción**
Despliega en **Vercel**:
- ✅ **Sin restricciones corporativas**
- ✅ **Funcionalidad completa**
- ✅ **Colaboración en tiempo real**

## 🔍 **Verificación de Funcionamiento**

### **Indicadores de Éxito**
```bash
# En la consola del navegador deberías ver:
🔄 Iniciando proceso de subida a Supabase...
💾 Guardando CSV localmente como fallback...
✅ CSV guardado localmente: { file_size: 163073, ... }
```

### **En la Interfaz**
- ✅ **Fecha de actualización** visible
- ✅ **Hora de actualización** visible
- ✅ **Tamaño del archivo** correcto
- ✅ **Número de filas** correcto

## 🆘 **Solución de Problemas**

### **Si no aparece la fecha/hora**
1. Verifica que el archivo se subió correctamente
2. Revisa la consola para mensajes de error
3. Recarga la página para ver metadata persistente

### **Si no persiste entre sesiones**
1. Verifica que localStorage esté habilitado
2. Limpia cache del navegador
3. Verifica configuración de privacidad

### **Si quieres limpiar datos**
1. Abre herramientas de desarrollador (F12)
2. Application → Local Storage
3. Elimina `sap-gestion-csv-data`

## 🎉 **Conclusión**

**Para pruebas locales, usa el Sistema Híbrido:**

1. **Ejecuta**: `npm run dev`
2. **Abre**: `http://localhost:3000`
3. **Prueba**: Sube CSV y verifica funcionalidades
4. **Verifica**: Fecha/hora y persistencia

**¡Ya tienes todo lo necesario para hacer pruebas locales completas!** 