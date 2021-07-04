import * as admin from 'firebase-admin';
import logger from './logger';

function initialFirebase(firebaseFile: string) {
  const serviceAccount = require(firebaseFile);
  const config = {
    credential: admin.credential.cert(serviceAccount),
  };
  const firebase = admin.initializeApp(config);
  logger.info(
    `firebase initial: ${firebase.options.credential === config.credential}`
  );

  return firebase;
}

export { initialFirebase };
