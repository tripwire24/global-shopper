const CACHE_NAME = 'global-shopper-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './favicon.png',
    'https://unpkg.com/react@17/umd/react.production.min.js',
    'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js',
    'https://unpkg.com/babel-standalone@6/babel.min.js',
    'https://unpkg.com/lucide@latest',
    'https://cdn.tailwindcss.com'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // Cache assets individually to handle failures gracefully
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            return null;
                        })
                    )
                );
            })
            .then(() => self.skipWaiting()) // Ensure the new service worker takes over immediately
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Ensure the service worker takes control of all clients immediately
            self.clients.claim()
        ])
    );
});

// Fetch Strategy: Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and certain URLs
    if (
        event.request.method !== 'GET' || 
        event.request.url.startsWith('chrome-extension://') ||
        event.request.url.includes('googleusercontent')
    ) {
        return;
    }

    // Handle API requests
    if (event.request.url.includes('api.exchangerate-api.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    // Clone the response to store in cache
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return new Response(
                                JSON.stringify({
                                    error: 'You are offline. Using last known exchange rates.',
                                    rates: null // You might want to store some default rates
                                }),
                                {
                                    headers: { 'Content-Type': 'application/json' }
                                }
                            );
                        });
                })
        );
        return;
    }

    // For all other requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses
                if (!response || response.status !== 200) {
                    return response;
                }

                // Clone the response before caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // Only cache same-origin requests or specific CDN resources
                        if (
                            event.request.url.startsWith(self.location.origin) ||
                            ASSETS_TO_CACHE.includes(event.request.url)
                        ) {
                            cache.put(event.request, responseToCache)
                                .catch(err => console.warn('Cache put failed:', err));
                        }
                    });
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // Return a custom offline page or fallback content
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Not available offline', { status: 404 });
                    });
            })
    );
});
