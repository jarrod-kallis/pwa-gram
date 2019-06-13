importScripts('/src/js/idb.js');
importScripts('/src/js/utils/db.js');

const CACHE_STATIC = 'static-v44';
const CACHE_DYNAMIC = 'dynamic-v21';
const MAX_CACHE_ITEMS = 100;

const GET_POSTS_URL = 'https://pwagram-b7912.firebaseio.com/posts';
const POST_POSTS_URL =
  'https://us-central1-pwagram-b7912.cloudfunctions.net/storePostData';

const STATIC_FILES = [
  // '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  // Not necessary to cache these polyfills
  '/src/js/promise.js',
  '/src/js/fetch.js'
];

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache =>
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        console.log('Trim cache:', keys[0]);
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    })
  );
}

// Fired when the browser installs the service worker
self.addEventListener('install', event => {
  // console.log('[Service Worker] Installing Service Worker...', event);
  // Earliest time to cache assets
  // Must wait until everything is cached before finishing up the installation
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      console.log('[Service Worker] Precaching the app shell');
      // cache.add('/');
      // cache.add('/index.html');
      // cache.add('/src/js/app.js');
      // cache.add('/src/js/feed.js');

      cache.addAll(STATIC_FILES);
    })
  );
});

// Fired when the browser activates the service worker
// This event won't fire if you have existing instances of your app open in the browser.
// Check 'Application' tab in Chrome Dev Tools to see if a new service worker is waiting to activate.
// Shut down all tabs where app is running and re-open them. Just saw that Ctrl+F5 works as well.
self.addEventListener('activate', event => {
  // console.log('[Service Worker] Activating Service Worker...', event);

  event.waitUntil(
    caches.keys().then(cacheKeyList => {
      return Promise.all(
        cacheKeyList.map(cacheKey => {
          if (cacheKey !== CACHE_STATIC && cacheKey !== CACHE_DYNAMIC) {
            console.log('[Service Worker] Removing old cache:', cacheKey);
            return caches.delete(cacheKey);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     (async function() {
//       const cacheResponse = await caches.match(event.request);
//       if (cacheResponse) return cacheResponse;
//       return fetch(event.request);
//     })()
//   );
// });

self.addEventListener('fetch', event => {
  // Cache & Network strategy
  if (event.request.url.indexOf(GET_POSTS_URL) !== -1) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clonedRes = response.clone();
        clearData('posts').then(() => {
          return clonedRes.json().then(data => {
            Object.keys(data).map(post => {
              writeData('posts', data[post]);
            });
          });
        });
        return response;
      })
    );
  } else {
    const staticFileFound = STATIC_FILES.find(
      file => event.request.url.replace(self.origin, '') === file
    );

    if (staticFileFound) {
      // console.log('Found static file:', event.request.url);
      event.respondWith(caches.match(event.request));
    } else {
      // Cache first with network fallback strategy
      event.respondWith(
        caches.match(event.request).then(response => {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(fetchResponse => {
                return caches.open(CACHE_DYNAMIC).then(cache => {
                  // It might happen that the user requests an unknown route (404).
                  // Fetch doesn't throw an error in this regard, but it does indicate that the response is not okay.
                  // So don't cache something like this.
                  if (
                    fetchResponse.status !== 404 &&
                    // Stupid chrome-extension
                    event.request.url.indexOf('chrome-extension') === -1 &&
                    event.request.method !== 'POST'
                  ) {
                    // Can only consume a response once so need to clone it in order to also return it
                    cache.put(event.request, fetchResponse.clone());
                    trimCache(CACHE_DYNAMIC, MAX_CACHE_ITEMS);
                  }
                  return fetchResponse;
                });
              })
              .catch(() =>
                caches.open(CACHE_STATIC).then(cache => {
                  // if (event.request.url.indexOf('.html') !== -1) {
                  if (
                    event.request.headers.get('accept').includes('text/html')
                  ) {
                    return cache.match('/offline.html');
                  } else {
                    return null;
                  }
                })
              );
          }
        })
      );
    }
  }
});

// Cache with Network fallback strategy
// self.addEventListener('fetch', event => {
//   // if (event.request.url.startsWith('https://httpbin.org')) {
//   //   console.log('[Service Worker] Fetching something...', event);
//   // }

//   // event.respondWith(null);
//   // event.respondWith(fetch(event.request));
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(fetchResponse => {
//             return caches.open(CACHE_DYNAMIC).then(cache => {
//               // Can only consume a response once so need to clone it in order to also return it
//               cache.put(event.request.url, fetchResponse.clone());
//               return fetchResponse;
//             });
//           })
//           .catch(() =>
//             caches
//               .open(CACHE_STATIC)
//               .then(cache => cache.match('/offline.html'))
//           );
//       }
//     })
//   );
// });

// Cache only strategy
// self.addEventListener('fetch', event => {
//   event.respondWith(caches.match(event.request));
// });

// Network only strategy
// self.addEventListener('fetch', event => {
//   event.respondWith(fetch(event.request));
// });

// Network with cache fallback strategy
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request)
//       .then(fetchResponse => {
//         return caches.open(CACHE_DYNAMIC).then(cache => {
//           cache.put(event.request.url, fetchResponse.clone());
//           return fetchResponse;
//         });
//       })
//       .catch(() => {
//         return caches.match(event.request).then(response => {
//           if (response) {
//             return response;
//           } else {
//             return caches
//               .open(CACHE_STATIC)
//               .then(cache => cache.match('/offline.html'));
//           }
//         });
//       })
//   );
// });

self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event);

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new posts');

    event.waitUntil(
      readData('sync-posts').then(posts => {
        for (let post of posts) {
          console.log(post);
          fetch(POST_POSTS_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              ...post
            })
          })
            .then(response => {
              console.log(response);
              if (response.ok) {
                return response.json();
              } else {
                throw new Error(
                  'Unable to sync post:',
                  response.status,
                  response.statusText
                );
              }
            })
            .then(data => {
              console.log('Data synchronised:', data);
              deleteSingleItem('sync-posts', data.id); // post.id);
            })
            .catch(error => {
              console.log('Error syncing data', error);
            });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  console.log('Notification:', notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log('Action:', action);
    event.waitUntil(
      clients.matchAll().then(clientList => {
        console.log('Clients:', clientList);
        // const client = clientList.find(client => {
        //   return client.visibilityState === 'visible';
        // });

        // console.log('Found client:', client);
        if (clientList.length > 0) {
          clientList[0].navigate(notification.data.url);
          clientList[0].focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

// User swiped the notification away/clicked the X (basically didn't want to interact with it at all)
self.addEventListener('notificationclose', event => {
  console.log('Notification was closed.', event);
});

self.addEventListener('push', event => {
  console.log('Push notification received.', event);

  let data = { title: 'New!', content: 'Something new happened', openUrl: '/' };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
