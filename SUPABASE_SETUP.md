# 🔧 Configuración de Supabase

## Problema Actual
El error "⚠️ Conexión a Supabase" indica que las variables de entorno no están configuradas.

## Solución Paso a Paso

### 1. Crear Archivo de Variables de Entorno

```bash
# En la raíz del proyecto, copia el archivo de ejemplo
cp env.example .env.local
```

### 2. Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **Settings** → **API**
4. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Variables de Entorno

Edita el archivo `.env.local` y reemplaza los valores:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui

# SSL Configuration (para entornos corporativos)
NODE_TLS_REJECT_UNAUTHORIZED=0

# OAuth Configuration (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=tu-microsoft-client-id

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Crear Tabla en Supabase

Ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- Crear tabla para metadata de CSV
CREATE TABLE IF NOT EXISTS csv_metadata (
  id SERIAL PRIMARY KEY,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size BIGINT NOT NULL,
  uploaded_by TEXT,
  row_count INTEGER NOT NULL
);

-- Crear bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('csv-storage', 'csv-storage', false)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acceso (opcional)
CREATE POLICY "Allow authenticated users to upload CSV files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'csv-storage' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read CSV files" ON storage.objects
  FOR SELECT USING (bucket_id = 'csv-storage' AND auth.role() = 'authenticated');
```

### 5. Reiniciar Servidor

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
npm run dev
```

### 6. Verificar Conexión

1. Abre la aplicación en el navegador
2. Deberías ver "✅ Conexión a Supabase Exitosa"
3. Si hay errores, revisa la consola del navegador

## Solución de Problemas

### Error: "Supabase no está configurado"
- Verifica que el archivo `.env.local` existe
- Confirma que las variables están correctamente configuradas
- Reinicia el servidor después de cambios

### Error: "Error al conectar con Supabase Storage"
- Verifica que la URL y clave anónima son correctas
- Confirma que el bucket `csv-storage` existe
- Revisa las políticas de acceso en Supabase

### Error: "Error al acceder al bucket de almacenamiento"
- Verifica que las políticas de acceso están configuradas
- Confirma que el usuario está autenticado

### Entornos Corporativos
Si estás en un entorno corporativo con proxy/SSL:

```env
# Agregar estas variables si es necesario
NODE_TLS_REJECT_UNAUTHORIZED=0
HTTPS_PROXY=http://proxy.corporacion.com:8080
HTTP_PROXY=http://proxy.corporacion.com:8080
```

## Verificación Final

Después de la configuración, deberías ver:

1. ✅ **Conexión a Supabase Exitosa** en la interfaz
2. ✅ **Bucket: csv-storage** disponible
3. ✅ **Base de datos** conectada
4. ✅ Capacidad de subir y sincronizar archivos CSV

## Soporte

Si persisten los problemas:

1. Revisa los logs en la consola del navegador
2. Verifica la configuración en Supabase Dashboard
3. Confirma que las variables de entorno están cargadas correctamente 