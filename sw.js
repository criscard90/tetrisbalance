/* Tetris Balance Tower - Service Worker
   Strategia: NETWORK-FIRST su tutto.
   Il contenuto viene SEMPRE richiesto alla rete quando online, così ogni
   aggiornamento pubblicato è subito disponibile; la cache serve solo da
   fallback quando si è offline. */
const CACHE_NAME = 'tetrisbalance-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/tetris1.png',
  './img/tetris2.png',
  './img/tetris3.png',
  './img/tetris4.png',
  './img/tetris5.png',
  './img/tetris6.png',
  './music/ska.mp3',
  './music/dance.mp3',
  './music/ragtime.mp3',
  './music/jazz.mp3'
];

// Installa il nuovo SW IMMEDIATAMENTE (niente attesa della vecchia pagina)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Attivazione: rimuove tutte le vecchie cache e prende subito il controllo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// NETWORK-FIRST: prima la rete (sempre fresco), poi cache (offline)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Risposta valida: aggiorna la cache e restituisci
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: servi dalla cache
        return caches.match(request, { ignoreSearch: true })
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});