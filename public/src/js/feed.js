var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleElement = document.querySelector('#title');
var locationElement = document.querySelector('#location');
var snackbarElement = document.querySelector('#confirmation-toast');

var videoPlayer = document.querySelector('#player');
var canvas = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerDiv = document.querySelector('#pick-image');
let picture = null;

var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var locationPosition = { lat: null, lng: null };

locationBtn.addEventListener('click', () => {
  console.log('Click Location Button');
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(
    position => {
      locationBtn.style.display = 'inline-block';
      locationLoader.style.display = 'none';

      locationPosition.lat = position.coords.latitude;
      locationPosition.lng = position.coords.longitude;

      locationElement.value = 'Not In Munich';
      document.querySelector('#manual-location').classList.add('is-focused');

      console.log(position);
    },
    error => {
      locationBtn.style.display = 'inline-block';
      locationLoader.style.display = 'none';
      locationPosition = { lat: null, lng: null };

      alert('Unable to retrieve GPS coordinates');
      console.error('No location for you: ', error);
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
});

function initialiseLocation() {
  // locationLoader.style.display = 'none';

  if (!'geolocation' in navigator) {
    locationBtn.style.display = 'none';
  }
}

function initialiseMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = constraints => {
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented.'));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false
    })
    .then(stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(() => {
      imagePickerDiv.style.display = 'block';
    });
}

captureButton.addEventListener('click', event => {
  event.preventDefault();

  canvas.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  const context = canvas.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
  // context.drawImage(
  //   videoPlayer,
  //   0,
  //   0,
  //   canvas.width,
  //   videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  // );

  // console.log(videoPlayer.videoHeight, videoPlayer.videoWidth, canvas.width);

  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });

  picture = dataURItoBlob(canvas.toDataURL());
});

imagePicker.addEventListener('change', event => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  createPostArea.style.transform = 'translateY(0)';
  initialiseMedia();
  initialiseLocation();

  // if (deferredPrompt) {
  //   deferredPrompt.prompt();

  //   // Show the banner to add the app to the home screen
  //   deferredPrompt.userChoice.then(choice => {
  //     console.log(choice.outcome);

  //     if (choice.outcome === 'dismissed') {
  //       console.log('User cancelled installation');
  //     } else {
  //       console.log('User added app to home screen');
  //     }
  //   });

  //   deferredPrompt = null;
  // }

  // Unregister a service worker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(registrations => {
  //     registrations.map(registration => registration.unregister());
  //   });
  // }
}

function closeCreatePostModal() {
  // createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
  videoPlayer.style.display = 'none';
  imagePickerDiv.style.display = 'none';
  canvas.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    });
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Allow user to save some content for offline viewing
const onCardSaveButtonClick = event => {
  caches.open('user-requested-v1').then(cache => {
    cache.add('/src/images/sf-boat.jpg');
    cache.add('https://httpbin.org/get');
  });
};

const clearCards = () => {
  console.log('Clearing cards');
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.firstChild);
  }
};

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.backgroundPosition = 'center';
  // cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onCardSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUi(data) {
  clearCards();
  data.forEach(data => {
    createCard(data);
  });
}

// Network & cache strategy
const GET_URL = 'https://pwagram-b7912.firebaseio.com/posts.json';
const POST_URL =
  'https://us-central1-pwagram-b7912.cloudfunctions.net/storePostData';
let gotCardFromNetwork = false;

fetch(GET_URL)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log('Got cards from network');
    gotCardFromNetwork = true;
    const posts = Object.keys(data).map(post => {
      return data[post];
    });
    console.log(posts);
    updateUi(posts);
  });

// setTimeout(() => {
if ('indexedDB' in window) {
  readData('posts').then(data => {
    if (!gotCardFromNetwork) {
      console.log('Got cards from cache:', data);
      updateUi(data);
    } else {
      console.log('Already got card from network');
    }
  });
}
// if ('caches' in window) {
//   caches
//     .match(url)
//     .then(response => {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(data => {
//       if (data) {
//         if (!gotCardFromNetwork) {
//           console.log('Got cards from cache');
//           const posts = Object.keys(data).map(post => {
//             return data[post];
//           });
//           updateUi(posts);
//         } else {
//           console.log('Already got card from network');
//         }
//       }
//     });
// }
// }, 3000);

function sendData(post) {
  const postData = new FormData();
  postData.append('id', post.id);
  postData.append('title', post.title);
  postData.append('location', post.location);
  postData.append('file', post.picture, post.id + '.png');
  postData.append('locationCoordinates', post.locationCoordinates);

  fetch(POST_URL, {
    method: 'POST',
    body: postData
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log(data);
    });
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const title = titleElement.value.trim();
  const location = locationElement.value.trim();

  if (title === '' || location === '') {
    alert('Invalid data');
    return;
  }

  closeCreatePostModal();

  const post = {
    id: new Date().toISOString(),
    title,
    location,
    picture,
    locationCoordinates: JSON.stringify(locationPosition)
  };

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    console.log('We have access to background synchronisation');

    navigator.serviceWorker.ready.then(sw => {
      writeData('sync-posts', post)
        .then(() => {
          return sw.sync.register('sync-new-posts');
        })
        .then(() => {
          const data = { message: 'Your post was saved for syncing' };
          snackbarElement.MaterialSnackbar.showSnackbar(data);
        })
        .catch(error => console.error('Error saving post.', error));
    });
  } else {
    sendData(post);
  }
});
