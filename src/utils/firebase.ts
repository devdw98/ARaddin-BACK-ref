import * as admin from 'firebase-admin';
import { firebaseAuth } from '../app';
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

// firebase token 검증
async function checkFirebase(token: string): Promise<string> {
  try {
    const userInfo = await firebaseAuth.verifyIdToken(token); //getUser(token);
    const email = userInfo.email;
    return email ? email : null;
  } catch (err) {
    logger.error(err);
    return null;
  }
}

export { initialFirebase, checkFirebase };
