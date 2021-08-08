import logger from '../utils/logger';
import { firestore } from '../app';
import { IUser } from '../models/user';

const collection = `users`;

async function insert(user: IUser) {
  try {
    const ref = firestore.collection(collection);
    const info = user;
    const doc = await ref.doc(user.email).set(info);
    console.log(`${doc.writeTime.toDate().getDate() - new Date().getDate()}`);
    return !(doc.writeTime.toDate().getDate() - new Date().getDate());
  } catch (e) {
    logger.error(e);
  }
}

async function find(user: IUser) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(user.email).get();
    if (!doc.exists) {
      return null; //사용자 없음
    }
    const data = await doc.data();
    return user;
  } catch (e) {
    logger.error(e);
  }
}
async function findAndUpdate(user: IUser) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(user.email).get();
    if (!doc.exists) {
      return null; //사용자 없음
    }
    const data = await doc.data();
    if (data.nickname !== user.nickname) {
      const updateDoc = await ref
        .doc(user.email)
        .update({ nickname: user.nickname });
      return updateDoc ? user : null;
    }
    return user;
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
      photoPath: photoPath,
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
      photoPath: data.photoPath,
    };
    return user;
  } catch (e) {
    logger.error(e.message);
  }
}
export { insert, findAndUpdate, findByPhotoPath, findByEmail };
