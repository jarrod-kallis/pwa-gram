// Variable to store the 'banner install' event
let deferredPrompt;

if (!window.Promise) {
  window.Promise = Promise;
}

// Does the browser support service workers?
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then(() => console.log('Service worker registered!'))
    .catch(error => console.error('Unable to register service worker:', error));
}

// Catch the event thrown when Chrome wants to show the banner where the user can add the app to the device's home screen
window.addEventListener('beforeinstallprompt', event => {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;

  return false;
});

(async function() {
  try {
    const response = await fetch('https://httpbin.org/ip');
    console.log(response);
    if (response.ok) {
      const data = await response.json();
      console.log(data);
    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error(error);
  }
})();

(async function() {
  try {
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      // headers: {
      //   'Content-Type': 'application/json',
      //   Accept: 'application/json'
      // },
      mode: 'cors', // 'no-cors'
      body: JSON.stringify({ message: 'hi' })
    });
    console.log(response);
    if (response.ok) {
      const data = await response.json();
      console.log(data);
    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error(error);
  }
})();

var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://httpbin.org/ip');
xhr.responseType = 'json';

xhr.onload = () => console.log('XHR Response:', xhr.response);
xhr.onerror = () => console.error('XHR Error:', xhr);

xhr.send();
