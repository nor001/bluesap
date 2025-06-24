# 🔍 Guía de Diagnóstico - File Size 0

## 🚨 Problema Identificado

El archivo se guarda en la tabla de metadata pero el `file_size` aparece como 0, lo que indica que:
- ✅ La conexión a Supabase funciona (se puede escribir en la tabla)
- ❌ El archivo no se está subiendo correctamente a Supabase Storage

## 🔧 Pasos de Diagnóstico

### 1. Verificar Configuración de Supabase

Abre tu navegador y ve a:
```
http://localhost:3000/api/test-supabase
```

Esto te mostrará:
- Si Supabase está configurado correctamente
- Si el bucket `csv-storage` existe
- Qué archivos hay en el bucket

### 2. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 3. Verificar Bucket en Supabase

En tu proyecto de Supabase:
1. Ve a **Storage**
2. Verifica que existe el bucket `csv-storage`
3. Si no existe, créalo manualmente

### 4. Verificar Políticas de Storage

En el SQL Editor de Supabase, ejecuta:
```sql
-- Verificar políticas existentes
SELECT * FROM storage.policies WHERE bucket_id = 'csv-storage';

-- Crear políticas si no existen
CREATE POLICY "Allow uploads to csv-storage" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'csv-storage');

CREATE POLICY "Allow reads from csv-storage" ON storage.objects
FOR SELECT USING (bucket_id = 'csv-storage');

CREATE POLICY "Allow updates to csv-storage" ON storage.objects
FOR UPDATE USING (bucket_id = 'csv-storage');
```

### 5. Probar Subida Manual

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Sube un archivo CSV
4. Revisa los logs que aparecen

Deberías ver algo como:
```
🔄 Iniciando proceso de subida a Supabase...
📁 Archivo recibido: { name: "archivo.csv", size: 1234, type: "text/csv" }
🔄 Intentando subir archivo a Supabase Storage...
📁 Nombre del archivo: archivo.csv
📏 Tamaño del archivo: 1234 bytes
🏪 Bucket: csv-storage
📄 Nombre en storage: central.csv
✅ Archivo subido exitosamente a Supabase Storage
```

## 🐛 Posibles Causas y Soluciones

### Causa 1: Bucket no existe
**Síntoma**: Error "Bucket not found"
**Solución**: Crear el bucket `csv-storage` en Supabase

### Causa 2: Políticas de acceso incorrectas
**Síntoma**: Error "Access denied"
**Solución**: Configurar las políticas de storage

### Causa 3: Variables de entorno incorrectas
**Síntoma**: Error de conexión
**Solución**: Verificar `.env.local`

### Causa 4: Problema de certificados SSL
**Síntoma**: Error "unable to get local issuer certificate"
**Solución**: Usar el script de configuración

## 🚀 Solución Rápida

Si quieres una solución inmediata:

1. **Ejecuta el script de configuración**:
   ```bash
   # Windows
   setup-env.bat
   
   # Linux/Mac
   ./setup-env.sh
   ```

2. **Verifica la configuración**:
   ```
   http://localhost:3000/api/test-supabase
   ```

3. **Si el bucket no existe**, créalo manualmente en Supabase

4. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```

## 📊 Verificación Final

Después de aplicar las soluciones:

1. Sube un archivo CSV
2. Verifica en la consola que aparezcan los logs de éxito
3. Ve a Supabase Storage y verifica que el archivo `central.csv` existe
4. Verifica en la tabla `csv_metadata` que `file_size` no sea 0

## 🆘 Si el Problema Persiste

Si después de seguir estos pasos el problema persiste:

1. **Comparte los logs** de la consola del navegador
2. **Comparte la respuesta** de `/api/test-supabase`
3. **Verifica** que el bucket existe en Supabase
4. **Confirma** que las políticas están configuradas

## 📝 Notas Técnicas

- El `file_size` se obtiene del objeto `File` del navegador
- Si el archivo no se sube a Storage, el tamaño será 0
- La metadata se guarda independientemente del éxito de la subida
- Los logs detallados ayudan a identificar el punto exacto del fallo 