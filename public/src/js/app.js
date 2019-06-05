// Does the browser support service workers?
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => {
    console.log('Service worker registered!');
  });
}
