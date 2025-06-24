# SAP Gestion - Next.js

Aplicación de gestión de proyectos SAP migrada de Streamlit a Next.js.

## 🚀 Setup Rápido

```bash
npm install
cp env.example .env.local
# Configurar credenciales en .env.local
npm run dev
```

## 📦 Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Producción
npm run start        # Servidor
npm run lint         # Linting
```

## 🔧 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_servicio
```

## 🌐 Despliegue

```bash
vercel --prod
```

---

**Funcionalidades**: Timeline, CSV upload, asignación automática, filtros, métricas 