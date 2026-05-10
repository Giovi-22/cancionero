# Plan de Implementación: Sistema de Caché Persistente y Sincronización Offline Incremental

Este plan detalla la evolución del sistema de caché actual (basado en `sessionStorage`) hacia un sistema profesional persistente basado en **IndexedDB**, optimizado para el uso offline total del cancionero.

## Objetivos
1. **Persistencia Total**: Las canciones no se borrarán al cerrar el navegador.
2. **Sincronización Incremental**: Solo descargar canciones nuevas o modificadas.
3. **Carga Instantánea**: Priorizar el contenido local para que la app se sienta instantánea.
4. **Offline por Defecto**: Permitir tocar en vivo sin depender de la conexión a internet.

## Componentes Técnicos

### 1. Motor de Almacenamiento: IndexedDB
Migraremos de `sessionStorage` a **IndexedDB**. 
- **Por qué**: `localStorage` tiene un límite de ~5MB. IndexedDB permite gigabytes de almacenamiento y es asíncrono, lo que evita que la interfaz se trabe mientras se guardan cientos de canciones.
- **Estructura de la base de datos**:
  - `songs`: Almacena el `id`, `name`, `content`, `lastModified` (de Google Drive) y `cachedAt`.
  - `repertoire`: Almacena la lista completa de canciones (el índice).

### 2. Servicio de Sincronización (`SyncService.ts`)
Este servicio se encargará de la lógica pesada:
- **Flujo de Sincronización**:
  1. Obtener la lista de canciones desde la API de Google Drive.
  2. Comparar los `id` y fechas de modificación de la lista con los que ya tenemos en IndexedDB.
  3. Identificar qué canciones faltan o se actualizaron.
  4. Descargar solo los fragmentos necesarios en background.
- **Optimización de Red**: Usar una cola de descarga controlada para no saturar la conexión.

### 3. Sincronización Automática
- Se disparará automáticamente cuando se detecte una sesión activa de Google.
- Se ejecutará de forma silenciosa. Si falla por falta de internet, la app simplemente usará lo que ya tiene guardado.

## Plan de Acción
1. **Actualizar `CacheService.ts`**: Reemplazar lógica de `sessionStorage` por IndexedDB.
2. **Crear `SyncService.ts`**: Implementar la lógica de comparación e incrementalidad.
3. **Integrar en la UI**: Actualizar `layout.tsx` y `page.tsx` para usar el nuevo sistema de carga instantánea.
