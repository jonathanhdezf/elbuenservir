// Service Worker for El Buen Servir PWA - v3
const CACHE_NAME = 'el-buen-servir-v3';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for other tabs
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Always Network-First for HTML/JS/CSS to ensure users see updates instantly
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request);
      })
  );
});

// Handle push notification clicks (focus app or open ticket)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if available
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if (client.url && client.navigate) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no tab open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle incoming background push messages
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Nuevo Pedido',
      body: event.data ? event.data.text() : 'Se ha recibido un nuevo pedido en el sistema.'
    };
  }

  const title = data.title || '🔔 ¡Nuevo Pedido en El Buen Servir!';
  const options = {
    body: data.body || 'Revisa los detalles en el monitor de comandas.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || `order-${Date.now()}`,
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
