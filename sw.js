const CACHE_NAME = 'video-player-cache-v1.9.2'; // Increment version
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'lib/video-js.css',
    'lib/video.min.js'
];

// Install a service worker
self.addEventListener('install', event => {
    console.log('SW: Service Worker installing. Cache version:', CACHE_NAME); // Log version
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Opened cache');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('SW: cache.addAll failed:', error);
                    // Log which URL failed if possible
                    Promise.all(urlsToCache.map(url => fetch(url).then(response => {
                        if (!response.ok) {
                            console.error('SW: Failed to fetch URL:', url, response.status, response.statusText);
                        }
                        return response;
                    }))).catch(fetchError => {
                        console.error('SW: Individual fetch error during addAll debug:', fetchError);
                    });
                    throw error; // Re-throw to ensure install fails
                });
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

// IndexedDB setup for shared files
const DB_NAME = 'shared-files-db';
const STORE_NAME = 'shared-files';

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error opening IndexedDB:', event.target.error);
        };
    });
}

async function storeSharedFile(file) {
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.add({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            blob: file // Store the Blob directly
        });

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error storing file:', event.target.error);
    });
}


// Intercept fetch requests
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // If the request is a POST to the app's origin, it's the share target.
    if (event.request.method === 'POST' && url.origin === self.location.origin) {
        console.log('SW: Intercepted POST request for share target.');
        console.log('SW: Request URL:', event.request.url);
        console.log('SW: Request Origin:', url.origin);
        console.log('SW: Self Location Origin:', self.location.origin);

        event.respondWith(async function() {
            try {
                const formData = await event.request.formData();
                const files = formData.getAll('video'); // 'video' is the name from manifest.json params
                console.log('SW: FormData parsed. Found files:', files.length);

                if (files.length > 0) {
                    console.log('SW: Storing shared file(s) in IndexedDB.');
                    for (const file of files) {
                        console.log('SW: File to store:', file.name, file.type, file.size);
                        await storeSharedFile(file);
                        console.log('SW: Stored file:', file.name, 'in IndexedDB.');
                    }
                } else {
                    console.log('SW: No files found in FormData.');
                }

                // Respond with the app shell to launch the PWA.
                // After processing the share, redirect to a clean URL to avoid re-processing on refresh.
                // A 303 See Other redirect is recommended.
                return Response.redirect('index.html', 303);
            } catch (error) {
                console.error('SW: Error processing share target:', error);
                return new Response('Error processing share target', { status: 500 });
            }
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