# 🔗 Configuración de Callback URL para OAuth

## 🎯 **¿Dónde se Configura el Callback URL?**

El Callback URL se configura en **DOS lugares**:

### **1️⃣ Google Cloud Console (Google OAuth)**
### **2️⃣ Supabase Dashboard (Configuración de Auth)**

---

## 🚀 **Paso 1: Google Cloud Console**

### **Ubicación Exacta:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Encuentra tu **OAuth 2.0 Client ID**
5. Haz clic en el **Client ID** para editarlo

### **Configuración:**
En la sección **"Authorized redirect URIs"**, agrega:

```
http://localhost:3000/auth/callback
https://tu-proyecto.supabase.co/auth/v1/callback
```

### **Ejemplo Completo:**
```
Authorized redirect URIs:
✅ http://localhost:3000/auth/callback
✅ https://abc123.supabase.co/auth/v1/callback
```

---

## 🚀 **Paso 2: Supabase Dashboard**

### **Ubicación Exacta:**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Settings**
4. Busca la sección **"URL Configuration"**

### **Configuración:**
```
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/auth/callback
```

### **Ejemplo Completo:**
```
Site URL: http://localhost:3000
Redirect URLs: 
✅ http://localhost:3000/auth/callback
```

---

## 🔧 **Configuración Detallada**

### **Google Cloud Console - Paso a Paso:**

1. **Acceder a Google Cloud Console:**
   ```
   https://console.cloud.google.com
   ```

2. **Navegar a Credentials:**
   ```
   Menu → APIs & Services → Credentials
   ```

3. **Editar OAuth 2.0 Client:**
   - Busca tu **OAuth 2.0 Client ID**
   - Haz clic en el nombre del cliente
   - Ve a la pestaña **"OAuth 2.0 Client IDs"**

4. **Configurar Redirect URIs:**
   ```
   Authorized redirect URIs:
   http://localhost:3000/auth/callback
   https://tu-proyecto.supabase.co/auth/v1/callback
   ```

5. **Guardar Cambios:**
   - Haz clic en **"Save"**

### **Supabase Dashboard - Paso a Paso:**

1. **Acceder a Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **Navegar a Authentication:**
   ```
   Tu Proyecto → Authentication → Settings
   ```

3. **Configurar URLs:**
   ```
   Site URL: http://localhost:3000
   Redirect URLs: http://localhost:3000/auth/callback
   ```

4. **Guardar Cambios:**
   - Haz clic en **"Save"**

---

## 🧪 **Verificación de Configuración**

### **Prueba 1: Verificar Google OAuth**
1. Ve a Google Cloud Console
2. Verifica que las URLs estén en **"Authorized redirect URIs"**
3. Asegúrate de que no haya espacios extra

### **Prueba 2: Verificar Supabase**
1. Ve a Supabase Dashboard
2. Verifica que **Site URL** y **Redirect URLs** estén correctos
3. Asegúrate de que no haya espacios extra

### **Prueba 3: Probar Autenticación**
1. Ejecuta: `.\start-local.ps1`
2. Abre: `http://localhost:3000`
3. Haz clic en "Continuar con Google"
4. Verifica que la redirección funcione

---

## 🔍 **URLs Específicas por Entorno**

### **Desarrollo Local:**
```
Google Cloud Console:
✅ http://localhost:3000/auth/callback
✅ https://tu-proyecto.supabase.co/auth/v1/callback

Supabase Dashboard:
✅ Site URL: http://localhost:3000
✅ Redirect URLs: http://localhost:3000/auth/callback
```

### **Producción (Vercel):**
```
Google Cloud Console:
✅ https://tu-app.vercel.app/auth/callback
✅ https://tu-proyecto.supabase.co/auth/v1/callback

Supabase Dashboard:
✅ Site URL: https://tu-app.vercel.app
✅ Redirect URLs: https://tu-app.vercel.app/auth/callback
```

---

## 🆘 **Solución de Problemas**

### **Error: "redirect_uri_mismatch"**
**Causa:** URL de redirección no coincide con la configurada
**Solución:**
1. Verifica que la URL en Google Cloud Console coincida exactamente
2. Verifica que no haya espacios extra
3. Verifica que el protocolo sea correcto (http vs https)

### **Error: "Invalid redirect URI"**
**Causa:** URL no autorizada en Supabase
**Solución:**
1. Verifica que la URL esté en **Redirect URLs** de Supabase
2. Verifica que **Site URL** esté configurado correctamente

### **Error: "OAuth client not found"**
**Causa:** Client ID incorrecto o no configurado
**Solución:**
1. Verifica que el Client ID esté correcto en Supabase
2. Verifica que el Client Secret esté configurado

---

## 📊 **Resumen de URLs**

| Entorno | Google Cloud Console | Supabase Dashboard |
|---------|---------------------|-------------------|
| **Local** | `http://localhost:3000/auth/callback` | `http://localhost:3000` |
| **Producción** | `https://tu-app.vercel.app/auth/callback` | `https://tu-app.vercel.app` |

---

## 🎯 **Comandos de Verificación**

```powershell
# 1. Verificar configuración
.\diagnose-auth.ps1

# 2. Iniciar servidor
.\start-local.ps1

# 3. Probar autenticación
# Abrir: http://localhost:3000
# Hacer clic en "Continuar con Google"
```

---

## 🎉 **Resultado Esperado**

Después de configurar correctamente:
- ✅ **Redirección exitosa** después del login
- ✅ **Sin errores de OAuth**
- ✅ **Acceso a la aplicación** después de la autenticación
- ✅ **Error 403 resuelto** (si la tabla `invited_users` está configurada)

**¡La configuración del Callback URL es crucial para que funcione la autenticación!** 🚀 