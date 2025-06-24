# 🚀 SAP Gestion - Migración a Next.js + Vercel

## 📋 Resumen de la Migración

Esta aplicación ha sido migrada exitosamente de **Streamlit** a **Next.js** para desplegarse en **Vercel**, manteniendo **100% de la funcionalidad** original y agregando **almacenamiento centralizado** con Supabase.

### ✅ Funcionalidades Preservadas

- ✅ **Timeline interactivo** con Plotly.js
- ✅ **Upload y procesamiento** de archivos CSV
- ✅ **Asignación automática** de recursos
- ✅ **Filtros dinámicos** (Proyecto, Módulo, Grupo)
- ✅ **Métricas en tiempo real**
- ✅ **Export de datos** a CSV
- ✅ **Arquitectura IA** (ServiceManager, logging estructurado)
- ✅ **Configuración centralizada** de recursos

### 🆕 Nuevas Funcionalidades

- ✅ **Almacenamiento centralizado** en Supabase Storage
- ✅ **CSV compartido** - un solo archivo para todos los usuarios
- ✅ **Metadata con fecha/hora** de última actualización
- ✅ **Sobrescritura automática** del archivo anterior
- ✅ **Información de actualización** visible al usuario

## 🏗️ Arquitectura Nueva

### Frontend (Next.js 14)
```
app/
├── components/           # Componentes React
│   ├── Timeline.tsx     # Timeline con Plotly
│   ├── Filters.tsx      # Filtros dinámicos
│   ├── Metrics.tsx      # Métricas en tiempo real
│   └── CSVUpload.tsx    # Upload de archivos (actualizado)
├── api/                 # API Routes (Edge Functions)
│   ├── upload/route.ts  # Procesamiento CSV + Supabase
│   ├── assign/route.ts  # Asignación de recursos
│   ├── csv-metadata/    # Metadata del CSV
│   └── download-csv/    # Descarga del CSV centralizado
├── lib/                 # Lógica de negocio
│   ├── config.ts        # Configuración centralizada
│   ├── store.ts         # State management (Zustand)
│   ├── supabase.ts      # Configuración Supabase (nuevo)
│   └── types/           # TypeScript types (actualizado)
└── page.tsx             # Página principal
```

### Backend (Supabase)
```
supabase/
├── storage/
│   └── csv-storage/     # Bucket para archivos CSV
│       └── central.csv  # Archivo CSV centralizado
└── database/
    └── csv_metadata     # Tabla con metadata del CSV
```

### Tecnologías Utilizadas

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para styling
- **Zustand** para state management
- **Plotly.js** para visualizaciones
- **Papa Parse** para CSV processing
- **Lucide React** para iconos
- **Supabase** para almacenamiento centralizado (nuevo)

## 🚀 Instalación y Desarrollo

### 1. Configurar Supabase

**Importante**: Antes de ejecutar la aplicación, debes configurar Supabase:

1. Sigue las instrucciones en `SUPABASE_SETUP.md`
2. Crea un proyecto en Supabase
3. Configura el bucket `csv-storage`
4. Crea la tabla `csv_metadata`
5. Configura las variables de entorno

### 2. Variables de Entorno

Crea un archivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_del_proyecto_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_supabase
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

### 5. Construir para Producción
```bash
npm run build
```

### 6. Desplegar en Vercel
```bash
# Conectar repositorio a Vercel
# O usar CLI:
vercel --prod
```

## 📊 Funcionalidad de CSV Centralizado

### 🔄 Flujo de Trabajo

1. **Usuario A** sube un CSV → Se guarda como `central.csv` en Supabase
2. **Usuario B** accede → Ve la fecha/hora de la última actualización
3. **Usuario C** sube un nuevo CSV → Sobrescribe `central.csv` y actualiza metadata
4. **Todos los usuarios** ven el CSV más reciente automáticamente

### 📅 Información Mostrada

- **Fecha de actualización**: Formato español (ej: "15 de enero de 2024")
- **Hora de actualización**: Formato 24h (ej: "14:30:25")
- **Número de filas**: Cantidad de registros procesados
- **Tamaño del archivo**: En MB

### 🛡️ Seguridad

- ✅ Validación de archivos (tipo, tamaño)
- ✅ Políticas de acceso en Supabase
- ✅ Sanitización de inputs
- ✅ Rate limiting en API routes

## 📊 Comparación: Streamlit vs Next.js

| Aspecto | Streamlit (Original) | Next.js (Nuevo) |
|---------|---------------------|-----------------|
| **Performance** | Server-side rendering | SSR + Client-side hydration |
| **Escalabilidad** | Limitada | Serverless functions |
| **UI/UX** | Básica | Moderna y responsive |
| **Deployment** | Streamlit Cloud | Vercel (global CDN) |
| **Type Safety** | Python typing | TypeScript completo |
| **State Management** | Session state | Zustand persistente |
| **API** | Integrada | Edge functions |
| **Mobile** | Básico | Responsive completo |
| **Almacenamiento** | Local | Supabase centralizado |
| **Colaboración** | No | CSV compartido en tiempo real |

## 🔧 Configuración de Recursos

La configuración de recursos se mantiene idéntica a la original:

```typescript
// app/lib/config.ts
static DEVELOPERS_CONFIG_GRID = {
  "Fabricio Sánchez": { level: "SENIOR", max_tasks: 15, color: "#FF6B6B" },
  "Oscar Castellanos": { level: "SENIOR", max_tasks: 15, color: "#4ECDC4" },
  // ... más recursos
};
```

## 📈 Algoritmos Preservados

### 1. Asignación de Recursos
- ✅ Cálculo de fechas laborables
- ✅ Detección de conflictos temporales
- ✅ Asignación basada en grupos
- ✅ Priorización por horas

### 2. Procesamiento de Datos
- ✅ Validación de CSV
- ✅ Normalización de fechas
- ✅ Limpieza de datos
- ✅ Filtros dinámicos

### 3. Visualización
- ✅ Timeline con Plotly
- ✅ Color coding por recursos
- ✅ Hover tooltips
- ✅ Zoom y pan

## 🌐 Despliegue en Vercel

### Configuración Automática
- **Edge Functions** para API routes
- **Global CDN** para assets
- **Auto-scaling** según demanda
- **HTTPS** automático

### Variables de Entorno
```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="SAP Gestion"
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_supabase
```

## 📱 Responsive Design

La aplicación es completamente responsive:
- **Desktop**: Layout completo con sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Stack vertical optimizado

## 🔒 Seguridad

- ✅ Validación de archivos (tipo, tamaño)
- ✅ Sanitización de inputs
- ✅ Rate limiting en API routes
- ✅ CORS configurado
- ✅ Políticas de acceso en Supabase

## 📊 Performance

### Métricas Objetivo
- **First Load**: < 3s
- **Timeline Render**: < 2s
- **CSV Processing**: < 5s
- **Lighthouse Score**: 95+

### Optimizaciones
- Server-side rendering para datos iniciales
- Client-side hydration para interactividad
- Edge functions para procesamiento
- Image optimization automática
- Supabase Storage para archivos

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 📝 Logs y Monitoreo

- **Vercel Analytics** integrado
- **Error tracking** automático
- **Performance monitoring**
- **User interaction tracking**
- **Supabase logs** para storage

## 🔄 Migración de Datos

### CSV Format
El formato de CSV se mantiene compatible:
- Header en línea 4 (como original)
- Columnas: PROY, Módulo, Titulo, etc.
- Fechas en formato dd/mm/yyyy

### Configuración
- Recursos y colores preservados
- Configuración de grupos mantenida
- Fechas de feriados actualizadas

## 🎯 Próximos Pasos

1. **Testing exhaustivo** de funcionalidades
2. **Optimización** de performance
3. **Integración** con sistemas externos
4. **Analytics** avanzados
5. **Mobile app** nativa (opcional)
6. **Autenticación** de usuarios (opcional)
7. **Historial** de versiones del CSV (opcional)

## 📚 Documentación Adicional

- `SUPABASE_SETUP.md` - Configuración detallada de Supabase
- `README.md` - Documentación original del proyecto

---

**✅ Migración Completada Exitosamente**

La aplicación mantiene toda la funcionalidad original mientras aprovecha las ventajas de la arquitectura moderna web. 