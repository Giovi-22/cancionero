const CACHE_NAME = 'cancionero-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/songs',
  '/setlists',
  '/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Estrategia: Network First, falling back to cache
  // Esto asegura que tengamos lo más nuevo si hay red, pero funcione si no.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear la respuesta exitosa
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar buscar en cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Si no está en cache y es una página, podríamos mostrar una página offline genérica
          return caches.match('/');
        });
      })
  );
});
