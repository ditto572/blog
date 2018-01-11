importScripts('/blog/test/serviceworker-cache-polyfill.js');

var CACHE_NAME = 'cache-name';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/blog/'
      ]);
    }).then(function(){
      console.log('설치완료');
    }).catch(function(){
      console.log('설치실패');
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request.clone()).then(function(resp) {
          if (resp.status<400) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        });
      })
  );
});


self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(resp) {
        if(resp) {
          return resp;
        }
        return fetch(event.request.clone()).then(function(resp) {
          if (resp.status<400 && (resp.url.indexOf("a.json")>=0)) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        });
      });
    })
  );
});