// Service Worker — CM Configurator v2 (single-file)

const CACHE_NAME = 'cm-configurator-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') {
    return;
  }

  const isLocal = url.origin === self.location.origin;
  const isGoogleFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isLocal && !isGoogleFonts) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
