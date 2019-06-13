// Variable to store the 'banner install' event
let deferredPrompt;
const notificationButtons = document.querySelectorAll('.enable-notifications');

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

const displayNotificationConfirmation = () => {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You successfully subscribed to our notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      images: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // Must be 'BCP 47' compliant
      // Vibration, pause, vibration
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm',
          title: 'Okay',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'Cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };

    navigator.serviceWorker.ready.then(reg =>
      reg.showNotification('Successfully subscribed', options)
    );
  }
  // new Notification('Successfully subscribed', options);
};

const configurePushSubscription = () => {
  navigator.serviceWorker.ready.then(registration =>
    registration.pushManager
      .getSubscription()
      .then(subscription => {
        if (!subscription) {
          // Create a new subscription
          const vapidPublicKey =
            'BJn3uuGP9D0zjr8IimACunVvr5RPTJsbbWF0XDraEDN1YXfcMEiXpzt--ReYeEGd1sANuM2zHooASS0ieZ-0fTs';
          const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidPublicKey
          });
        } else {
          // We have an existing subscription
        }
      })
      .then(newSubscription => {
        return fetch(
          'https://pwagram-b7912.firebaseio.com/subscriptions.json',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(newSubscription)
          }
        );
      })
      .then(response => {
        if (response.ok) {
          displayNotificationConfirmation();
        }
      })
      .catch(error =>
        console.error('Error creating notification subscription.', error)
      )
  );
};

const askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User notification choice:', result);

    if (result === 'granted') {
      // displayNotificationConfirmation();
      configurePushSubscription();
    } else {
      console.log('No notifications for this guy');
    }
  });
};

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let notificationButton of notificationButtons) {
    // console.log(notificationButton);
    notificationButton.style.display = 'inline-block';
    notificationButton.addEventListener('click', askForNotificationPermission);
  }
}

// (async function() {
//   try {
//     const response = await fetch('https://httpbin.org/ip');
//     console.log(response);
//     if (response.ok) {
//       const data = await response.json();
//       console.log(data);
//     } else {
//       throw new Error(response.statusText);
//     }
//   } catch (error) {
//     console.error(error);
//   }
// })();

// (async function() {
//   try {
//     const response = await fetch('https://httpbin.org/post', {
//       method: 'POST',
//       // headers: {
//       //   'Content-Type': 'application/json',
//       //   Accept: 'application/json'
//       // },
//       mode: 'cors', // 'no-cors'
//       body: JSON.stringify({ message: 'hi' })
//     });
//     console.log(response);
//     if (response.ok) {
//       const data = await response.json();
//       console.log(data);
//     } else {
//       throw new Error(response.statusText);
//     }
//   } catch (error) {
//     console.error(error);
//   }
// })();

// var xhr = new XMLHttpRequest();
// xhr.open('GET', 'https://httpbin.org/ip');
// xhr.responseType = 'json';

// xhr.onload = () => console.log('XHR Response:', xhr.response);
// xhr.onerror = () => console.error('XHR Error:', xhr);

// xhr.send();
