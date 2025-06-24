# Configuración de Desarrollo sin Supabase

## 🚀 Configuración Rápida para Desarrollo

Si quieres probar la aplicación sin configurar Supabase inmediatamente, puedes usar esta configuración temporal:

### 1. Variables de Entorno Temporales

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Configuración temporal para desarrollo sin Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# O simplemente no crees el archivo .env.local
```

### 2. Funcionalidad Disponible

Con esta configuración, la aplicación funcionará con:

✅ **Procesamiento de CSV** - Funciona completamente
✅ **Asignación de recursos** - Funciona completamente  
✅ **Timeline interactivo** - Funciona completamente
✅ **Filtros y métricas** - Funcionan completamente
✅ **Export de datos** - Funciona completamente

⚠️ **Limitaciones temporales**:
- No se guarda el CSV en Supabase Storage
- No se muestra la fecha/hora de actualización
- Cada usuario ve solo su propio CSV subido

### 3. Mensajes en Consola

Verás estos mensajes en la consola del navegador:
```
⚠️ Supabase no está configurado. Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas.
```

Esto es normal y no afecta la funcionalidad básica.

## 🔧 Configuración Completa con Supabase

Cuando estés listo para usar la funcionalidad completa:

1. Sigue las instrucciones en `SUPABASE_SETUP.md`
2. Configura las variables de entorno con tus credenciales de Supabase
3. Reinicia el servidor de desarrollo

## 🎯 Próximos Pasos

1. **Probar funcionalidad básica** sin Supabase
2. **Configurar Supabase** cuando estés listo
3. **Habilitar funcionalidad completa** con CSV centralizado

## 📝 Notas Técnicas

- La aplicación está diseñada para funcionar con o sin Supabase
- Los errores de certificados SSL se manejan gracefulmente
- La funcionalidad básica no depende de Supabase
- Supabase es opcional para desarrollo local 