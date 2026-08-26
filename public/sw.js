// Portal Nacional PWA Service Worker (Phase 10)
const CACHE_NAME = 'portal-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
];

const PRIVATE_ROUTES = [
  '/account',
  '/admin',
  '/advertiser',
  '/api',
  '/auth',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly skip caching for private authenticated routes & API calls (Section 38)
  const isPrivate = PRIVATE_ROUTES.some((route) => url.pathname.startsWith(route));
  if (isPrivate || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      // If navigation request fails offline, fallback to /offline
      if (event.request.mode === 'navigate') {
        const offlinePage = await caches.match('/offline');
        if (offlinePage) return offlinePage;
      }

      return new Response('Sem conexão com a internet.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })
  );
});

// Push notification handling with discrete content (Section 33 & 34)
self.addEventListener('push', (event) => {
  let data = { title: 'Portal Nacional', body: 'Você tem uma nova atualização na sua conta.', url: '/account/notifications' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Você possui uma nova notificação em sua conta.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/account/notifications',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Portal Nacional', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/account/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
