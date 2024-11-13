// sw.js
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('global-shopper-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/app.js',
                '/icon-192.png',
                '/icon-512.png',
                'https://cdn.tailwindcss.com',
                'https://unpkg.com/react@17/umd/react.development.js',
                'https://unpkg.com/react-dom@17/umd/react-dom.development.js',
                'https://unpkg.com/@babel/standalone/babel.min.js'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['global-shopper-v1'];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
