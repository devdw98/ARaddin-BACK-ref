import logger from '../utils/logger';
import { firestore } from '../app';
import User from '../models/user';

const collection = `users`;

async function insert(user: User) {
  const ref = firestore.collection(collection);
  const info = user.get();
  const doc = await ref.doc(user.email).set(info);
  console.log(`${doc.writeTime.toDate().getDate() - new Date().getDate()}`);
  return !(doc.writeTime.toDate().getDate() - new Date().getDate());
}
async function find(user: User) {
  const ref = firestore.collection(collection);
  const doc = await ref.doc(user.email).get();
  if (!doc.exists) {
    return null; //사용자 없음
  }
  const data = await doc.data();
  return user;
}
async function findAndUpdate(user: User) {
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
    }
    return user;
  } catch (e) {
    logger.error(e);
  }
}
export { insert, findAndUpdate };
