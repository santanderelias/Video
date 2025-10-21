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
    const url = new URL(event.request.url);

    // If the request is a POST to the app's origin, it's the share target.
    // Respond with the app shell to launch the PWA.
    if (event.request.method === 'POST' && url.origin === self.location.origin) {
        event.respondWith(caches.match('index.html'));
        return;
    }

    // For all GET requests, use a cache-first strategy.
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response; // Serve from cache
            }
            return fetch(event.request); // Fetch from network
        })
    );
});
