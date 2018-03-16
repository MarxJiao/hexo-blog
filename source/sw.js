self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open('marx').then(function (cache) {
            return cache.addAll([
                '/css/fonts/fontawesome-webfont.woff?v=',
                '/css/style.css',
                '/js/script.js',
                '/css/images/banner.jpg'
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});