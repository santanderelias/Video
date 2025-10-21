const CACHE_NAME = 'video-player-cache-v1';
const urlsToCache = [
    '.', // Use '.' to refer to the current directory
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://vjs.zencdn.net/8.10.0/video-js.css',
    'https://vjs.zencdn.net/8.10.0/video.min.js'
];

// Install a service worker
self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
    // We only want to handle GET requests for caching.
    // Other requests, like the POST from a share target, should be ignored.
    if (event.request.method !== 'GET') {
        return;
    }

    // For GET requests, use a cache-first strategy.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request);
            })
    );
});
