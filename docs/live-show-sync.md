# 🎸 Feature: Sincronización de Banda en Vivo (Live Show)

> **Estado**: Pendiente de implementación  
> **Prioridad**: Alta  
> **Dependencia**: Tabla `live_sessions` en Supabase

---

## Concepto

El director crea una lista de canciones y puede:
- **Programar un show** (fecha/hora futura) → los músicos lo ven en la sección "Shows Próximos"
- **Iniciar un show ahora** → todos los músicos reciben un banner flotante para unirse

La sincronización es **únicamente de la canción activa**. Capo, transposición, scroll y todo lo demás lo maneja cada músico de forma individual.

---

## Flujo de Usuario

### Director
1. Va a "Mis Listas" → selecciona una lista
2. Toca **"▶ Iniciar Show Ahora"** o **"📅 Programar Show"**
3. Si inicia ahora → show pasa a estado `live` inmediatamente
4. Si programa → elige fecha/hora → show queda en estado `scheduled`
5. Cuando el show está live: navega por sus canciones normalmente
6. Toca **"⏹ Finalizar Show"** al terminar

### Músico
- **Show programado**: ve una tarjeta en la home/setlists: _"📅 Ensayo del Viernes - 20:00 - [Ver Lista]"_
- **Show en vivo**: aparece banner flotante en cualquier página: _"🔴 Show en vivo: [Lista] — [Director] [Unirme]"_
- Al tocar "Unirme": va a la canción actual del director en modo seguidor
- Cuando el director cambia de canción: se redirige automáticamente

---

## Base de Datos

### Tabla `live_sessions` (nueva)

```sql
create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  setlist_id text not null,
  setlist_name text not null,
  director_email text not null,
  director_name text not null,
  current_song_id text,
  status text default 'scheduled', -- 'scheduled' | 'live'
  scheduled_for timestamptz,       -- null = iniciado inmediatamente
  started_at timestamptz,
  created_at timestamptz default now()
);

-- Habilitar Realtime
alter publication supabase_realtime add table live_sessions;

-- RLS
alter table live_sessions enable row level security;

create policy "Anyone authenticated can read live sessions"
  on live_sessions for select
  to authenticated
  using (true);

create policy "Director can manage their own session"
  on live_sessions for all
  to authenticated
  using (auth.jwt() ->> 'email' = director_email);
```

---

## Arquitectura de Código

### Nuevos archivos

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useLiveSession.ts` | Hook central: startShow, endShow, scheduleShow, updateCurrentSong, subscribeToAllSessions |
| `src/components/layout/LiveShowBanner.tsx` | Banner flotante global (bottom de pantalla) |
| `src/components/songs/UpcomingShows.tsx` | Tarjetas de shows programados / en vivo |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/songs/SetlistManager.tsx` | Botones "Iniciar Show" y "Programar Show" |
| `src/components/songs/NativeSongViewer.tsx` | Modo seguidor con `?follow=[session_id]` |
| `src/app/layout.tsx` | Agregar `<LiveShowBanner />` |
| `src/app/page.tsx` | Agregar `<UpcomingShows />` en la home |

---

## Estados de una Sesión

```
[Creada por director]
       ↓
  status: 'scheduled'
  (visible en UpcomingShows)
       ↓
  Director toca "▶ Iniciar"
       ↓
  status: 'live'
  (banner aparece para músicos)
       ↓
  Director toca "⏹ Finalizar"
       ↓
  [Registro eliminado de la tabla]
  (banner desaparece)
```

---

## Detalles de UX

### LiveShowBanner (músicos)
- Posición: fijo en la parte inferior, z-index alto
- Estética: glassmorphism con borde accent y pulso animado en el indicador rojo
- Botón "Unirme" → navega a `/songs/[current_song_id]?follow=[session_id]`
- Botón "✕" para descartar (no se vuelve a mostrar en la misma sesión del browser)

### LiveShowBanner (director)
- Muestra: "📡 Show en vivo · [N] canciones"
- Botón "⏹ Finalizar"

### UpcomingShows
- Se muestra en la home si hay sesiones `scheduled` o `live`
- Tarjeta por cada sesión con nombre de lista, director, hora programada
- Si está `live`: badge "EN VIVO" pulsante + botón "Unirme"
- Si está `scheduled`: badge "Próximamente" + hora relativa ("en 2 horas")

---

## Verificación

1. Crear tabla en Supabase (SQL Editor)
2. Habilitar Realtime para `live_sessions` en Dashboard → Database → Replication
3. Test local con dos pestañas:
   - Pestaña 1: Iniciar show → verificar que el banner aparece en Pestaña 2
   - Pestaña 2: Unirme → verificar que está en la canción correcta
   - Pestaña 1: Cambiar canción → verificar redirección en Pestaña 2
   - Pestaña 1: Finalizar → verificar que banner desaparece en Pestaña 2
4. Test con show programado:
   - Programar show a futuro → verificar tarjeta en UpcomingShows
   - Iniciar manualmente → verificar transición a live
