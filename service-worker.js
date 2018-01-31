var CACHE_NAME = 'cache-name1';

// 제어된 페이지가 등록 프로세스를 시작하면 install 이벤트를 처리하는 서비스 워커 스크립트를 바라봅니다.
// install 이벤트는 서비스 워커가 받는 첫 번째 이벤트이며 한 번만 발생합니다.
self.addEventListener('install', function(event) {
  console.log('install event', event);
  // installEvent.waitUntil()에 전달된 프라미스는 설치의 기간과 성공 또는 실패에 대한 신호를 보냅니다.
  event.waitUntil(
    // cache를 open 합니다.
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('install cache', cache);
      // cache 등록 합니다.
      return cache.addAll([
        '/'
      ]);
    }).then(function(){
      console.log('설치완료');
    }).catch(function(){
      console.log('설치실패');
    })
  );
});

// 서비스 워커가 클라이언트를 제어하고 push 및 sync와 같은 함수 이벤트를 처리할 준비가 되면 activate 이벤트가 발생합니다.
self.addEventListener('activate', function(event) {
  console.log('activate event', event);
  var cacheWhitelist = ['cache-name1'];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      console.log('activate cacheNames', cacheNames);
      // whitelist에 등록되지 않은 cache를 삭제합니다.
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('V2 now ready to handle fetches!');
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // caches.match()에서 프라미스를 전달합니다.
    // 서비스 워커가 생성한 캐시에서 캐시된 결과가 있는지 찾습니다.
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // no hit!
        // 요청을 복제합니다. 그 이유는 요청이 Stream이고 본문은 한 번만 사용할 수 있기 때문입니다.
        var fetchRequest = event.request.clone();

        // 서버에 요청합니다.
        return fetch(fetchRequest).then(
          function(response) {
            // 응답이 유효한지 확인합니다.
            // 응답 유형이 자사에서 요청한 것임을 나타내는 basic인지 확인합니다. 이는 타사 자산에 대한 요청은 캐시되지 않음을 의미합니다.
            // if(!response || response.status !== 200 || response.type !== 'basic') {
            if(!response || response.status !== 200) {
              return response;
            }

            // 확인을 통과하면 응답을 복제합니다. (response - Stream)
            // 브라우저가 사용할 응답을 반환하고 캐시로도 전달하려면 하나는 브라우저로, 다른 하나는 캐시로 보낼 수 있도록 응답을 복제해야 합니다.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
