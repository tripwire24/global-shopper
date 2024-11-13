const CACHE_NAME = 'global-shopper-v1';
const STATIC_CACHE = 'global-shopper-static-v1';
const DYNAMIC_CACHE = 'global-shopper-dynamic-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://unpkg.com/react@17.0.2/umd/react.production.min.js',
    'https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js',
    'https://unpkg.com/babel-standalone@6.26.0/babel.min.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js',
    'https://cdn.tailwindcss.com'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE)
                .then(cache => {
                    console.log('Caching static assets');
                    return cache.addAll(STATIC_ASSETS);
                }),
            self.skipWaiting()
        ]).catch(error => {
            console.error('Cache addAll failed:', error);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys => Promise.all(
                keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map(key => {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    })
            )),
            self.clients.claim()
        ])
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Handle API requests
    if (event.request.url.includes('api.exchangerate-api.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Handle static assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(error => {
                        console.error('Fetch failed:', error);
                        // Return a fallback response if available
                        return caches.match('./offline.html');
                    });
            })
    );
});
