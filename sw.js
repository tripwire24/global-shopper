const CACHE_NAME = 'global-shopper-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://unpkg.com/react@17/umd/react.production.min.js',
    'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://cdn.tailwindcss.com'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
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
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Strategy: Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome-extension requests
    if (event.request.method !== 'GET' || 
        event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Handle API requests differently
    if (event.request.url.includes('api.exchangerate-api.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    return response;
                })
                .catch(() => {
                    return new Response(
                        JSON.stringify({
                            error: 'You are offline. Using last known exchange rates.'
                        }),
                        {
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // For all other requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response before caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // Only cache same-origin requests
                        if (event.request.url.startsWith(self.location.origin)) {
                            cache.put(event.request, responseToCache)
                                .catch(err => console.warn('Cache put failed:', err));
                        }
                    });
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then((response) => {
                        return response || new Response('Not found', { status: 404 });
                    });
            })
    );
});
