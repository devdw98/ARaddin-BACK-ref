import { Setting } from '../models/room';
import { firestore } from '../app';
import { IUser, Master, User } from '../models/user';
import logger from '../utils/logger';

const collection = `rooms`;
const room_id = `roomInfo`;
const master_id = `master`;
const setting_id = `setting`;

export function setSetting(code: string, setting: Setting): Setting {
  try {
    const ref = firestore
      .collection(collection)
      .doc(code)
      .collection(room_id)
      .doc(setting_id);
    ref.set(setting.get());

    return setting;
  } catch (e) {
    logger.error(e.message);
  }
}

export async function getSetting(code: string): Promise<Setting> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(setting_id)
    .get();
  if ((await ref).exists) {
    const setting_data = (await ref).data();
    const setting = new Setting(
      setting_data.goal,
      setting_data.timeLimit,
      setting_data.place
    );
    return setting;
  }
  return null;
}

export async function setUsers(
  code: string,
  users: Array<IUser>
): Promise<IUser[]> {
  try {
    const ref = firestore.collection(collection).doc(code);
    const result: Array<IUser> = await ref
      .set({ users: users })
      .then(async () => {
        return (await ref.get()).data()['users'];
      });
    return result;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function getUsers(code: string): Promise<IUser[]> {
  try {
    const ref = firestore.collection(collection).doc(code);
    const users: Array<IUser> = (await ref.get()).data()['users'];
    return users;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function setMaster(code: string, master: Master): Promise<Master> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(master_id);
  ref.set(master.getMaster());
  return master;
}
export async function getMaster(code: string): Promise<Master> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(master_id);
  const data = (await ref.get()).data();
  const master = new Master(new User(data.email, data.nickname), data.isReady);
  return master;
}

export async function findRoomUsers(code: string): Promise<IUser[]> {
  try {
    const ref = firestore.collection(collection).doc(code).get();
    if (!(await ref).exists) {
      return null;
    }
    const datas: Array<User> = (await ref).data()['users'];
    return datas;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function deleteRoom(code: string) {
  try {
    const ref = firestore.collection(collection).doc(code);
    const doc = await ref.delete();
    return !!doc.writeTime;
  } catch (e) {
    logger.error(e);
  }
}
