# Contexto del Proyecto para Agentes de IA

Este documento sirve como guía principal para cualquier agente de Inteligencia Artificial que trabaje en este proyecto. 

## Proyecto: App Cancionero
Es una aplicación web diseñada para músicos que permite leer partituras, letras y acordes almacenados en una carpeta de Google Drive (Google Docs y PDFs). 

### Reglas Core
1. **Clean Code (Código Limpio)**:
   - Los nombres de variables, funciones y componentes deben ser descriptivos y en inglés (ej: `DriveService`, `SongList`, `fetchFiles`). El contenido visible para el usuario irá en Español.
   - Las funciones deben tener una única responsabilidad (Single Responsibility Principle).
   - Evitar "números mágicos" y cadenas de texto hardcodeadas. Usar constantes.
   - Manejo de errores claro y explícito (try/catch, mensajes de error útiles).

2. **Arquitectura y Patrones de Diseño**:
   - **Orientación a Componentes**: Utilizar React de manera modular. Cada componente debe ser reutilizable e independiente.
   - **Separation of Concerns (Separación de Responsabilidades)**:
     - `src/components`: Componentes visuales "tontos" o de presentación.
     - `src/hooks`: Lógica de estado y llamadas a APIs encapsuladas en Custom Hooks.
     - `src/services`: Clases o módulos puros de TypeScript que interactúan con APIs externas (ej. Google Drive API). Implementar el **Patrón Singleton** o inyección de dependencias para los servicios si es necesario.
     - `src/utils`: Funciones de formateo puras y utilidades.
   - **Container/Presenter Pattern**: Los componentes de "página" (Next.js pages) actúan como contenedores (Containers) que inyectan datos a los componentes de presentación (Presenters).

3. **Stack Tecnológico**:
   - **Next.js (App Router)**: Framework principal.
   - **TypeScript**: Estricto tipado de datos para todos los props, respuestas de API y estados.
   - **TailwindCSS**: Para los estilos. Se debe mantener un diseño responsivo "Mobile-First" y preparar un tema oscuro nativo (para escenarios y ensayos).
   - **PWA (Progressive Web App)**: La app debe poder funcionar offline eventualmente usando service workers y caché.

### Estructura de Directorios Deseada

```text
/src
  /app           # Next.js App Router (Rutas y Páginas)
  /components
    /ui          # Botones, Inputs, Modales genéricos
    /songs       # Componentes específicos del dominio de canciones
    /layout      # Navbar, Sidebar, etc.
  /hooks         # Custom hooks (ej: useDriveFiles, useAuth)
  /services      # Servicios de comunicación (ej: DriveService.ts)
  /types         # Interfaces y Types de TypeScript
  /utils         # Funciones puras (ej: extractDocsText.ts, formatChords.ts)
```

Por favor, lee este archivo antes de sugerir o crear nuevos componentes para asegurar la coherencia arquitectónica.
