// Fired when the browser installs the service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', event);
});

// Fired when the browser activates the service worker
// This event won't fire if you have existing instances of your app open in the browser.
// Check 'Application' tab in Chrome Dev Tools to see if a new service worker is waiting to activate.
// Shut down all tabs where app is running and re-open them. Just saw that Ctrl+F5 works as well.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...', event);
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetching something...', event);

  // event.respondWith(null);
  event.respondWith(fetch(event.request));
});
