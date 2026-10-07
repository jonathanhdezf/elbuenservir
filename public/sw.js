// Service Worker for El Buen Servir PWA - v4
const CACHE_NAME = 'el-buen-servir-v4';

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

// Handle push notification clicks (focus app or open window, and navigate to orders module)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notifData = event.notification.data || {};
  const orderId = notifData.orderId || null;
  const targetUrl = notifData.url || (orderId ? `/?view=admin&section=orders&orderId=${orderId}` : '/?view=admin&section=orders');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Try to find an existing window and focus it
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus().then((focusedClient) => {
            const activeClient = focusedClient || client;

            // Direct message to the active client
            activeClient.postMessage({
              type: 'NAVIGATE_TO_ADMIN_ORDERS',
              action: 'open_orders',
              view: 'admin',
              section: 'orders',
              orderId: orderId
            });

            // Also broadcast through channel for maximum reliability across tabs/workers
            try {
              const channel = new BroadcastChannel('el_buen_servir_sw_channel');
              channel.postMessage({
                type: 'NAVIGATE_TO_ADMIN_ORDERS',
                action: 'open_orders',
                view: 'admin',
                section: 'orders',
                orderId: orderId
              });
              channel.close();
            } catch (e) {
              // BroadcastChannel not available in this worker environment
            }

            // If the client supports navigate, ensure url updates if not on orders
            if (activeClient.navigate && activeClient.url && !activeClient.url.includes('section=orders')) {
              try {
                const url = new URL(activeClient.url);
                url.searchParams.set('view', 'admin');
                url.searchParams.set('section', 'orders');
                if (orderId) url.searchParams.set('orderId', orderId);
                return activeClient.navigate(url.href);
              } catch (e) {
                // ignore
              }
            }
          });
        }
      }

      // 2. If no window is currently open (e.g. tapped from lock screen with browser closed)
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
      title: '🔔 ¡Nuevo Pedido en El Buen Servir!',
      body: event.data ? event.data.text() : 'Se ha recibido un nuevo pedido en el sistema.'
    };
  }

  const orderId = data.orderId || null;
  const targetUrl = data.url || (orderId ? `/?view=admin&section=orders&orderId=${orderId}` : '/?view=admin&section=orders');
  const title = data.title || (orderId ? `🔔 ¡Nuevo Pedido #${orderId}!` : '🔔 ¡Nuevo Pedido en El Buen Servir!');

  const options = {
    body: data.body || 'Toca para abrir el módulo de pedidos en el panel de administración.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || (orderId ? `order-${orderId}` : `order-${Date.now()}`),
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: {
      action: 'open_orders',
      view: 'admin',
      section: 'orders',
      orderId: orderId,
      url: targetUrl
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
