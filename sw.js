const CACHE_NAME = 'isa4-pwa-v4';
const OFFLINE_URL = '/Isaai/offline.html';
const RUNTIME_CACHE = 'runtime-cache-v1';

const urlsToCache = [
    '/Isaai/',
    '/Isaai/index.html',
    '/Isaai/manifest.json',
    '/Isaai/offline.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aperta');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => !currentCaches.includes(name))
                            .map(name => caches.delete(name))
            );
        })
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Gestione richieste di navigazione
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // Strategia Cache First per altre richieste
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Non memorizzare in cache le richieste non GET
                        if (event.request.method !== 'GET') return response;
                        
                        // Clona la risposta per la cache
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE)
                            .then(cache => cache.put(event.request, responseClone));
                        
                        return response;
                    })
                    .catch(() => {
                        // Risposta generica per errori
                        return new Response('Connessione assente', {
                            status: 503,
                            headers: new Headers({'Content-Type': 'text/plain'})
                        });
                    });
            })
    );
});
