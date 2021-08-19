import logger from '../utils/logger';
import { firestore } from '../app';
import { IUser, User } from '../models/user';

const collection = `users`;

async function insert(user: User) {
  try {
    const ref = firestore.collection(collection);
    const info = user.get();
    const doc = await ref.doc(user.email).set(info);
    console.log(`${doc.writeTime.toDate().getDate() - new Date().getDate()}`);
    return !(doc.writeTime.toDate().getDate() - new Date().getDate());
  } catch (e) {
    logger.error(e);
  }
}

async function isExisted(user: User) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(user.email).get();
    return doc.exists;
  } catch (e) {
    logger.error(e);
  }
}
async function update(user: User) {
  try {
    const ref = firestore.collection(collection).doc(user.email);
    const updateDoc = await ref.update({ nickname: user.nickname });
    return updateDoc ? user : null;
  } catch (e) {
    logger.error(e);
  }
}

async function findByPhotoPath(photoPath: string) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(photoPath + '@gmail.com').get();
    if (!doc.exists) {
      return null;
    }
    const data = await doc.data();
    const user: IUser = {
      email: data.email,
      nickname: data.nickname,
    };
    return user;
  } catch (e) {
    logger.error(e);
  }
}

async function findByEmail(email: string) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(email).get();
    if (!doc.exists) {
      return null;
    }
    const data = await doc.data();
    const user: IUser = {
      email: data.email,
      nickname: data.nickname,
    };
    return user;
  } catch (e) {
    logger.error(e.message);
  }
}
export { isExisted, insert, update, findByPhotoPath, findByEmail };
