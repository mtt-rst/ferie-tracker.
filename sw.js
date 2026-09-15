const CACHE='ferie-tracker-v5';
const STATIC=['./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // HTML/navigazione: sempre prova prima la rete.
  // L'index NON viene più mantenuto come copia "forte" in cache.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // File statici: cache-first, con fallback rete.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (req.method === 'GET' && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
      }
      return response;
    }))
  );
});
