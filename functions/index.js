const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const serviceAccount = require('./pwagram-firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-b7912.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(() => {
        console.log('Setting up webPush');
        webPush.setVapidDetails(
          'mailto:jarrod.kallis@gmail.com',
          'BJn3uuGP9D0zjr8IimACunVvr5RPTJsbbWF0XDraEDN1YXfcMEiXpzt--ReYeEGd1sANuM2zHooASS0ieZ-0fTs',
          'WXKFTcd3ZNU-GaxhODGhZ4Xy-JuyH7RQ4MN9yYdxiKc'
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value');
      })
      .then(subscriptions => {
        console.log('Subscriptions:', subscriptions);
        subscriptions.forEach(subscription => {
          const pushConfig = {
            endpoint: subscription.val().endpoint,
            keys: {
              auth: subscription.val().keys.auth,
              p256dh: subscription.val().keys.p256dh
            }
          };
          console.log('Sending notification:', pushConfig);
          webPush.sendNotification(
            pushConfig,
            JSON.stringify({
              title: 'New Post',
              content: 'New Post added!',
              openUrl: '/help/index.html'
            })
          );
          // .catch(error =>
          //   console.error('Error sending push notification.', error)
          // );
        });

        console.log('Sent notification');
        return response
          .status(201)
          .json({ message: 'Post stored', id: request.body.id });
      })
      .catch(error => {
        response.status(500).json({ error });
      });
  });
});
