const CACHE_NAME = 'LiftMetrics-cache-v2.5.6'; // Incrementa questa versione ad ogni modifica importante
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Installazione del Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
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

// Strategia Network First con fallback su Cache
self.addEventListener('fetch', (e) => {
  // Escludi le chiamate a Supabase o esterne dalla cache del service worker
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Se la rete risponde, aggiorna la cache in background per la prossima volta
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Se siamo offline o la rete fallisce, restituisci il file dalla cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});