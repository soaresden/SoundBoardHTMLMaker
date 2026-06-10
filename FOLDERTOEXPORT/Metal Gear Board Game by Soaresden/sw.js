/* Soundboard / App - Service Worker
   Stratégie:
   - MÉDIAS (sons, images, polices) -> cache-first (mode hors-ligne, persiste).
   - CODE (HTML, JS, CSS, JSON) -> network-first : version la plus récente en ligne,
     repli sur le cache hors-ligne.
   - Message "PRECACHE" -> télécharge et met en cache une liste d'URLs (progression).
   Chaque branche renvoie TOUJOURS une Response (sinon: TypeError "Failed to convert
   value to 'Response'"). */
const CACHE = 'soundboard-offline-v3';
const MEDIA_RE = /\.(?:mp3|ogg|wav|m4a|aac|flac|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot)(?:\?.*)?$/i;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isMedia(url) {
  if (MEDIA_RE.test(url.pathname)) return true;
  if (url.origin !== self.location.origin && /(?:gstatic|googleapis)\.com$/.test(url.host)) return true;
  return false;
}

const OFFLINE_RESP = () => new Response('', { status: 504, statusText: 'Offline' });

async function putSafe(req, resp) {
  try {
    if (resp && (resp.ok || resp.type === 'opaque')) {
      const copy = resp.clone();
      const cache = await caches.open(CACHE);
      await cache.put(req, copy);
    }
  } catch (_) {}
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    putSafe(req, resp);
    return resp || OFFLINE_RESP();
  } catch (_) {
    return OFFLINE_RESP();
  }
}

async function networkFirst(req) {
  try {
    const resp = await fetch(req);
    if (resp && resp.ok) putSafe(req, resp);
    return resp || (await caches.match(req)) || OFFLINE_RESP();
  } catch (_) {
    return (await caches.match(req)) || OFFLINE_RESP();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  // Ignore les schémas non http(s) (chrome-extension, data, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  event.respondWith(isMedia(url) ? cacheFirst(req) : networkFirst(req));
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
