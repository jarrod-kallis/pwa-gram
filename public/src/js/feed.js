var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
var sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.style.display = 'block';

  if (deferredPrompt) {
    deferredPrompt.prompt();

    // Show the banner to add the app to the home screen
    deferredPrompt.userChoice.then(choice => {
      console.log(choice.outcome);

      if (choice.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added app to home screen');
      }
    });

    deferredPrompt = null;
  }

  // Unregister a service worker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(registrations => {
  //     registrations.map(registration => registration.unregister());
  //   });
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
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
  cardTitle.style.height = '180px';
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
const url = 'https://pwagram-b7912.firebaseio.com/posts.json';
let gotCardFromNetwork = false;

fetch(url)
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
if ('caches' in window) {
  caches
    .match(url)
    .then(response => {
      if (response) {
        return response.json();
      }
    })
    .then(data => {
      if (data) {
        if (!gotCardFromNetwork) {
          console.log('Got cards from cache');
          const posts = Object.keys(data).map(post => {
            return data[post];
          });
          updateUi(posts);
        } else {
          console.log('Already got card from network');
        }
      }
    });
}
// }, 3000);
