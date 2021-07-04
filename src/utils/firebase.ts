import * as admin from 'firebase-admin';

function initialFirebase(firebaseFile: string) {
  const serviceAccount = require(firebaseFile);
  const config = {
    credential: admin.credential.cert(serviceAccount),
  };
  const firebase = admin.initializeApp(config);
  console.log(
    `firebase initial: ${firebase.options.credential === config.credential}`
  );
  return firebase;
}

export { initialFirebase };
