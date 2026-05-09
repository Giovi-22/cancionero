# Plan de Implementación: Mejoras de Origen y Soporte Offline

Este documento detalla el enfoque técnico para resolver dos necesidades clave del sistema:
1. Permitir configurar dinámicamente la carpeta de Google Drive de donde se leen las canciones.
2. Añadir soporte "offline" (modo caché) durante un Show en Vivo, para que cortes de internet no interrumpan a los músicos ni bloqueen la navegación del director.

## User Review Required

> [!IMPORTANT]
> **Limitación de Sincronización Offline:**
> Almacenar las canciones en caché permite que todos puedan seguir viendo la letra y acordes aunque se corte internet. Sin embargo, **la sincronización automática (el hecho de que a los músicos se les cambie la pantalla sola cuando el director pasa de canción) dejará de funcionar** si el director o el músico no tienen internet, ya que depende de los servidores de Supabase. En ese caso, la app no se va a colgar, y cada persona podrá avanzar manualmente a la siguiente canción sin problemas. ¿Estás de acuerdo con este comportamiento?

## Open Questions

1. **Guardado de la Carpeta de Drive:** ¿Preferís que el ID de la carpeta se guarde de forma local en el dispositivo (en `localStorage`), o que se guarde en la base de datos de Supabase asociado a tu usuario para que si entrás desde otro celular ya esté configurada?
2. **Interfaz de Configuración:** ¿Agregamos una página nueva `/settings` (Configuración) en el menú principal para poder cambiar este ID de carpeta?

---

## Cambios Propuestos

### 1. Configuración Dinámica de la Carpeta de Drive

Actualmente, el `folderId` está fijo en el archivo `.env`. Vamos a hacerlo dinámico.

#### [MODIFY] `src/app/api/drive/songs/route.ts`
- Modificar el endpoint para que reciba un parámetro `?folderId=XYZ` desde el cliente.
- Si no recibe ninguno, usará el `process.env.DRIVE_SHARED_FOLDER_ID` como valor por defecto (fallback).

#### [NEW] `src/hooks/useAppSettings.ts`
- Crear un hook que maneje la lectura y escritura del `folderId` en `localStorage` (y opcionalmente en Supabase).

#### [NEW] `src/app/settings/page.tsx`
- Crear una nueva página de configuración con un input simple donde el usuario pueda pegar el Link de la carpeta de Drive o directamente el ID.
- Al guardar, la app refrescará la lista de canciones haciendo un "fetch" a la nueva ruta.

---

### 2. Soporte Offline y Caché para Shows en Vivo

Para garantizar que nadie se quede sin partituras en pleno show si el internet falla.

#### [NEW] `src/services/CacheService.ts`
- Un servicio dedicado para almacenar las letras de las canciones (`content` en texto plano) en `sessionStorage` o `IndexedDB` (IndexedDB es mejor porque no tiene límite estricto de tamaño).

#### [MODIFY] `src/hooks/useLiveSession.ts`
- Al unirse a un show o iniciarlo, disparar una descarga en segundo plano (background) de **todas las canciones** que pertenecen al setlist de ese show.
- Manejar los errores de Supabase silenciosamente: cuando el director cambia de canción, si la llamada `updateCurrentSong` a Supabase falla por falta de internet, se ignorará el error para que la navegación siga fluyendo rápido en su pantalla.

#### [MODIFY] `src/app/songs/[id]/page.tsx` (y Server Actions relacionadas)
- Actualmente el servidor pide el contenido del doc a la API. Modificaremos la arquitectura de la vista de la canción para que, del lado del cliente, intente **primero leer la caché**. 
- Si la canción está cacheada, se renderiza al instante (incluso sin internet). Si no, hace el llamado a la API.

---

## Plan de Verificación

### Pruebas Manuales
1. **Carpeta Dinámica:** Ir a Configuración, cambiar el ID de carpeta por uno vacío o inválido, comprobar que la lista se vacía. Volver a poner el correcto y verificar que carga.
2. **Caché Offline:**
   - Iniciar un Show en Vivo con 3 canciones.
   - Esperar 5 segundos (para dar tiempo a que descargue el caché en background).
   - Apagar el Wi-Fi / Datos móviles.
   - Navegar entre las canciones (Siguiente / Anterior) y verificar que abren al instante y se ven completas.
   - Verificar que no hay errores bloqueantes en pantalla al cambiar de canción sin red.
