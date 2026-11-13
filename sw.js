var CACHE_NAME = "todo-v4";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches["delete"](key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function putInCache(request, response) {
  if (request.method === "GET" && response && response.status === 200) {
    var copy = response.clone();
    caches.open(CACHE_NAME).then(function (cache) {
      cache.put(request, copy);
    });
  }
  return response;
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var isPage = req.mode === "navigate" ||
    (req.method === "GET" && /\/(index\.html)?(\?.*)?$/.test(new URL(req.url).pathname));

  if (isPage) {
    // صفحه اصلی: اول از اینترنت (تا نسخه جدید فوراً برسد)، اگر آفلاین بود از حافظه
    event.respondWith(
      fetch(req).then(function (response) {
        return putInCache(req, response);
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // بقیه فایل‌ها (آیکن‌ها، manifest): اول از حافظه
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(req).then(function (response) {
        return putInCache(req, response);
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
