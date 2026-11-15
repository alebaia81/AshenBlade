// Service Worker per Ashen Blade: L'Ombra della Quercia
// Permette l'installazione PWA e il funzionamento completo offline.

const CACHE_NAME = 'ashenblade-pwa-v2';
const ASSETS_CRITICI = [
  './',
  './index.html',
  './gioco.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_CRITICI.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch {
            // Ignora errori di fetch preventiva
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
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
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) {
          // In background aggiorna la risorsa se online
          fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse);
              }
            })
            .catch(() => {});
          return cached;
        }

        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseClone);
        }
        return networkResponse;
      } catch {
        if (event.request.mode === 'navigate') {
          const fallback = (await caches.match('./')) || (await caches.match('./index.html'));
          if (fallback) return fallback;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
