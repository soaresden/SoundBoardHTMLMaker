/* Soundboard - Service Worker mode hors-ligne
   - Cache-first pour toutes les requetes GET (page, scripts, sons, covers, polices)
   - Message "PRECACHE" : telecharge et met en cache une liste d'URLs (avec progression)
   Le cache persiste entre les sessions => mode hors-ligne. */
const CACHE = 'soundboard-offline-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Nettoie les anciens caches d'une version precedente
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        try {
          if (resp && (resp.ok || resp.type === 'opaque')) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        } catch (_) {}
        return resp;
      }).catch(() => cached);
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'PRECACHE' && Array.isArray(data.urls)) {
    const port = event.ports && event.ports[0];
    (async () => {
      const cache = await caches.open(CACHE);
      const queue = data.urls.slice();
      const total = queue.length;
      let done = 0, ok = 0;
      const worker = async () => {
        while (queue.length) {
          const u = queue.shift();
          try {
            const resp = await fetch(u, { cache: 'reload' });
            if (resp && (resp.ok || resp.type === 'opaque')) {
              await cache.put(u, resp.clone());
              ok++;
            }
          } catch (_) {}
          done++;
          if (port) port.postMessage({ done, total, ok });
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (port) port.postMessage({ finished: true, done, total, ok });
    })();
  }
});
