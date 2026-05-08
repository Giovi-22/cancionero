# 🎸 Cancionero App Pro

Una aplicación de alto rendimiento diseñada por y para músicos, que transforma tu flujo de trabajo en el escenario y en el ensayo. Olvídate de los papeles y sincroniza todo tu repertorio directamente desde Google Drive con herramientas profesionales de transposición, sincronización de banda y más.

## 🚀 Funciones Principales

### 1. Gestión de Repertorio (Google Drive Sync)
*   **Sincronización Inteligente**: Lee archivos directamente de Google Drive (Google Docs).
*   **Búsqueda Exhaustiva**: Navegación recursiva por carpetas para encontrar todo tu catálogo.
*   **Limpieza de Texto Pro**: Algoritmo que elimina artefactos de formato y espacios excesivos de Google Docs manteniendo la estructura de estrofas.
*   **Carga Instantánea**: Sistema de cache en sesión y scroll infinito para manejar cientos de canciones sin retrasos.

### 2. Visor de Canciones Inteligente
*   **Transposición en Tiempo Real**: Cambia el tono de cualquier canción instantáneamente.
*   **Calculador de Capo**: Visualiza los acordes relativos al traste de tu capodastro.
*   **Auto-Scroll de Siguiente Generación**: Motor de animación a 60fps con micro-ajustes de velocidad (desde 0.1) para un deslizamiento fluido y ultra-lento.
*   **Modo Escenario (Stage Mode)**: Interfaz de alto contraste (fondo negro total) para evitar distracciones y ahorrar batería en vivo.
*   **Notas del Músico**: Añade recordatorios o anotaciones línea por línea que se guardan automáticamente.

### 3. Sincronización de Banda (Real-time)
*   **Modo Líder**: El líder de la banda controla qué canción se muestra en las pantallas de los demás.
*   **Modo Seguidor**: Los músicos pueden "unirse al show" y sus dispositivos cambiarán de canción automáticamente siguiendo al líder.
*   **Powered by Supabase**: Sincronización en milisegundos mediante WebSockets.

### 4. Herramientas de Ensayo
*   **Metrónomo Visual**: Pulso visual sutil ajustable por BPM para mantener el tempo sin ruidos molestos.
*   **Listas de Temas (Setlists)**: Crea, ordena y gestiona tus listas para cada show.
*   **Favoritos**: Acceso rápido a tus canciones más usadas.

### 5. Tecnología y Rendimiento
*   **Cloud Persistence**: Sincronización completa con Supabase (Favoritos, Setlists y Ajustes de Canción).
*   **PWA (Progressive Web App)**: Instalable en iOS, Android y PC para uso como app nativa.
*   **Arquitectura Moderna**: Next.js 15+, Tailwind CSS y diseño con estética "Glassmorphism" premium.

---

## 🛠️ Configuración Técnica

Para que la app funcione, se requieren las siguientes variables en `.env.local`:

```env
# Google Auth
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
NEXTAUTH_SECRET=...

# Google Drive
DRIVE_SHARED_FOLDER_ID=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## 📋 Próximos Pasos
- [ ] Exportación a PDF con ajustes aplicados.
- [ ] Cronómetro de duración de Setlist.
- [ ] Integración de audios de referencia/Backing Tracks.

---
*Desarrollado con ❤️ para músicos que buscan la perfección en el escenario.*
