// Service Worker for El Buen Servir PWA
const CACHE_NAME = 'el-buen-servir-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first with fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
