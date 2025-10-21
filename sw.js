const CACHE_NAME = 'video-player-cache-v2'; // Increment version
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
    console.log('Service Worker installing. Cache version:', CACHE_NAME); // Log version
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating. Cache version:', CACHE_NAME); // Log version
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // If the request is a POST to the app's origin, it's the share target.
    if (event.request.method === 'POST' && url.origin === self.location.origin) {
        event.respondWith(async function() {
            const formData = await event.request.formData();
            const files = formData.getAll('video'); // 'video' is the name from manifest.json params

            if (files.length > 0) {
                const client = await self.clients.get(event.clientId);
                if (client) {
                    // Send each file as a Blob to the client
                    for (const file of files) {
                        client.postMessage({
                            type: 'shared-file',
                            file: file
                        });
                    }
                }
            }

            // Respond with the app shell to launch the PWA.
            // After processing the share, redirect to a clean URL to avoid re-processing on refresh.
            // A 303 See Other redirect is recommended.
            return Response.redirect('index.html', 303);
        }());
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
