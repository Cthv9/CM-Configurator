// Cablemaster PWA — Service Worker
// ⚠ Incrementa CACHE_NAME ad ogni deploy che modifica catalog.json o rules.json
const CACHE_NAME = 'cablemaster-pwa-v4';

const CORE_ASSETS = [
  './',
  './index.html',
  './catalog.json',
  './rules.json',
  './manifest.webmanifest',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// File dati: network-first (aggiornati sempre se online)
const DATA_FILES = ['catalog.json', 'rules.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isData = DATA_FILES.some(f => url.pathname.endsWith(f));

  if (isData) {
    // Network-first: prende sempre la versione fresca, fallback cache se offline
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cache.match(req);
        }
      })()
    );
  } else {
    // Cache-first per HTML, icone, font, manifest
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (url.origin === self.location.origin) cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (await cache.match('./')) || cached;
        }
      })()
    );
  }
});
