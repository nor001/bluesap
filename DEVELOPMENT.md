# 🚀 Development Guide

## Prevención de Errores de ESLint en Vercel

### ✅ Configuración Automática

El proyecto está configurado para **fallar automáticamente** en errores de ESLint durante el build de Vercel.

### 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build con verificación de lint y types
npm run start        # Servidor de producción

# Verificación de Código
npm run lint         # ESLint con auto-fix
npm run lint:strict  # ESLint estricto (falla en warnings)
npm run type-check   # Verificación de TypeScript
npm run format       # Formateo con Prettier
npm run format:check # Verificación de formato

# Pre-build (ejecutado automáticamente)
npm run pre-build    # Verificación completa antes del build
```

### 🛡️ Prevención de Errores

#### 1. **Antes de Hacer Commit**

```bash
# Ejecutar verificación completa
npm run lint:strict
npm run type-check
npm run format:check
```

#### 2. **Configuración de VSCode**

- Instalar extensiones recomendadas (aparecerá automáticamente)
- El código se formatea automáticamente al guardar
- ESLint se ejecuta automáticamente al guardar

#### 3. **Reglas de ESLint Configuradas**

- ❌ **Variables no utilizadas** - Error (falla el build)
- ⚠️ **Console.log** - Warning
- ❌ **Any explícito** - Warning
- ✅ **Preferir const** - Error
- ✅ **Hooks de React** - Error/Warning

### 🚨 Errores Comunes y Soluciones

#### **Variable no utilizada**

```typescript
// ❌ Error
const unusedVar = 'something';

// ✅ Solución 1: Usar la variable
const usedVar = 'something';
console.log(usedVar);

// ✅ Solución 2: Prefijo con _
const _unusedVar = 'something';

// ✅ Solución 3: Eliminar la variable
```

#### **Import no utilizado**

```typescript
// ❌ Error
import { unusedFunction } from './utils';

// ✅ Solución: Eliminar el import
```

#### **Console.log en producción**

```typescript
// ⚠️ Warning
console.log('debug info');

// ✅ Solución: Usar logger o eliminar
if (process.env.NODE_ENV === 'development') {
  console.log('debug info');
}
```

### 🔄 Workflow Recomendado

1. **Desarrollo**: `npm run dev`
2. **Antes de commit**: `npm run lint:strict && npm run type-check`
3. **Formateo**: `npm run format` (si es necesario)
4. **Commit**: `git add . && git commit -m "message"`
5. **Push**: `git push`

### 📋 Checklist Pre-Commit

- [ ] `npm run lint:strict` ✅
- [ ] `npm run type-check` ✅
- [ ] `npm run format:check` ✅
- [ ] Tests pasan (si existen)
- [ ] Código revisado

### 🆘 Si el Build Falla en Vercel

1. **Ejecutar localmente**:

   ```bash
   npm run build
   ```

2. **Verificar errores específicos**:

   ```bash
   npm run lint:strict
   npm run type-check
   ```

3. **Corregir errores** y hacer nuevo commit

### 🎯 Beneficios

- ✅ **Builds consistentes** en Vercel
- ✅ **Código limpio** y mantenible
- ✅ **Detección temprana** de errores
- ✅ **Formato consistente** en el equipo
- ✅ **Mejor experiencia** de desarrollo
