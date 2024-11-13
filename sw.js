self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('global-shopper-cache').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './app.js',
        './style.css',
        './icon-192.png',
        './icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open('global-shopper-cache').then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
