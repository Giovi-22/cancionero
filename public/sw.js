// Service Worker básico para permitir la instalación
// En fases posteriores se puede expandir para cachear archivos de Drive

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
});

self.addEventListener('fetch', (event) => {
  // Estrategia de red primero para asegurar datos actualizados de Drive
  event.respondWith(fetch(event.request));
});
